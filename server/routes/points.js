const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { readData, writeData } = require('../db')
const { requireAuth } = require('../middleware/auth')

const uploadsDir = path.join(__dirname, '../uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    cb(null, unique + path.extname(file.originalname).toLowerCase())
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

function buildPoint(data, id) {
  const numId = parseInt(id)
  const point = data.points.find((p) => p.id === numId)
  if (!point) return null
  const images = data.images.filter((img) => img.point_id === numId)
  return {
    ...point,
    images,
    thumbnail: images.find((i) => i.is_thumbnail) || images[0] || null,
  }
}

// GET all points (public)
router.get('/', (req, res) => {
  const data = readData()
  const result = [...data.points]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((p) => {
      const images = data.images.filter((img) => img.point_id === p.id)
      return { ...p, images, thumbnail: images.find((i) => i.is_thumbnail) || images[0] || null }
    })
  res.json(result)
})

// GET single point (public)
router.get('/:id', (req, res) => {
  const point = buildPoint(readData(), req.params.id)
  if (!point) return res.status(404).json({ error: 'Not found' })
  res.json(point)
})

// POST create (admin)
router.post('/', requireAuth, upload.array('images', 10), (req, res) => {
  const { title, short_text, full_text, lat, lng } = req.body
  if (!title || !short_text || !full_text || !lat || !lng) {
    return res.status(400).json({ error: 'title, short_text, full_text, lat, lng are required' })
  }

  const data = readData()
  const id = data.nextId.points++

  data.points.push({
    id,
    title: title.trim(),
    short_text: short_text.trim(),
    full_text: full_text.trim(),
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    created_at: new Date().toISOString(),
  })

  if (req.files?.length) {
    req.files.forEach((f, i) => {
      data.images.push({
        id: data.nextId.images++,
        point_id: id,
        filename: f.filename,
        is_thumbnail: i === 0,
      })
    })
  }

  writeData(data)
  res.status(201).json(buildPoint(data, id))
})

// PUT update (admin)
router.put('/:id', requireAuth, upload.array('images', 10), (req, res) => {
  const data = readData()
  const numId = parseInt(req.params.id)
  const idx = data.points.findIndex((p) => p.id === numId)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })

  const { title, short_text, full_text, lat, lng, delete_image_ids, thumbnail_image_id } = req.body

  if (title !== undefined) data.points[idx].title = title.trim()
  if (short_text !== undefined) data.points[idx].short_text = short_text.trim()
  if (full_text !== undefined) data.points[idx].full_text = full_text.trim()
  if (lat !== undefined) data.points[idx].lat = parseFloat(lat)
  if (lng !== undefined) data.points[idx].lng = parseFloat(lng)

  // Delete specified images
  if (delete_image_ids) {
    const ids = JSON.parse(delete_image_ids).map(Number)
    for (const imgId of ids) {
      const imgIdx = data.images.findIndex((img) => img.id === imgId && img.point_id === numId)
      if (imgIdx !== -1) {
        const fp = path.join(uploadsDir, data.images[imgIdx].filename)
        if (fs.existsSync(fp)) fs.unlinkSync(fp)
        data.images.splice(imgIdx, 1)
      }
    }
  }

  // Add new images
  if (req.files?.length) {
    req.files.forEach((f) => {
      data.images.push({
        id: data.nextId.images++,
        point_id: numId,
        filename: f.filename,
        is_thumbnail: false,
      })
    })
  }

  // Set thumbnail
  if (thumbnail_image_id) {
    const thumbId = parseInt(thumbnail_image_id)
    data.images.forEach((img) => {
      if (img.point_id === numId) img.is_thumbnail = img.id === thumbId
    })
  }

  // Auto-assign thumbnail if none set
  const pointImages = data.images.filter((img) => img.point_id === numId)
  if (pointImages.length > 0 && !pointImages.some((img) => img.is_thumbnail)) {
    pointImages[0].is_thumbnail = true
  }

  writeData(data)
  res.json(buildPoint(data, numId))
})

// DELETE (admin)
router.delete('/:id', requireAuth, (req, res) => {
  const data = readData()
  const numId = parseInt(req.params.id)
  const idx = data.points.findIndex((p) => p.id === numId)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })

  data.images
    .filter((img) => img.point_id === numId)
    .forEach((img) => {
      const fp = path.join(uploadsDir, img.filename)
      if (fs.existsSync(fp)) fs.unlinkSync(fp)
    })

  data.points.splice(idx, 1)
  data.images = data.images.filter((img) => img.point_id !== numId)

  writeData(data)
  res.json({ success: true })
})

module.exports = router
