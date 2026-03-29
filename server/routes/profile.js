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
  filename: (req, file, cb) =>
    cb(null, `avatar-${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only images allowed'))
  },
})

// GET profile (public)
router.get('/', (req, res) => {
  const data = readData()
  res.json(data.profile || {})
})

// PUT profile (admin)
router.put('/', requireAuth, upload.single('avatar'), (req, res) => {
  const data = readData()
  if (!data.profile) data.profile = {}

  const { name, subtitle, bio, email, phone, linkedin, instagram, website } = req.body
  if (name !== undefined) data.profile.name = name.trim()
  if (subtitle !== undefined) data.profile.subtitle = subtitle.trim()
  if (bio !== undefined) data.profile.bio = bio.trim()
  if (email !== undefined) data.profile.email = email.trim()
  if (phone !== undefined) data.profile.phone = phone.trim()
  if (linkedin !== undefined) data.profile.linkedin = linkedin.trim()
  if (instagram !== undefined) data.profile.instagram = instagram.trim()
  if (website !== undefined) data.profile.website = website.trim()

  if (req.file) {
    if (data.profile.avatar) {
      const old = path.join(uploadsDir, data.profile.avatar)
      if (fs.existsSync(old)) fs.unlinkSync(old)
    }
    data.profile.avatar = req.file.filename
  }

  writeData(data)
  res.json(data.profile)
})

module.exports = router
