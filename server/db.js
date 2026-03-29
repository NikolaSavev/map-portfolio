const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const DATA_FILE = path.join(__dirname, 'data.json')

const DEFAULT_PROFILE = {
  name: 'Maja Saveva',
  subtitle: 'Digital Portfolio',
  bio: '',
  email: '',
  phone: '',
  linkedin: '',
  instagram: '',
  website: '',
  avatar: null,
}

const DEFAULT_DATA = () => ({
  profile: { ...DEFAULT_PROFILE },
  points: [],
  images: [],
  admins: [],
  nextId: { points: 1, images: 1, admins: 1 },
})

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    }
  } catch (e) {
    console.error('Failed to read data.json, starting fresh:', e.message)
  }
  return DEFAULT_DATA()
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

function initDb() {
  const uploadsDir = path.join(__dirname, 'uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  const data = readData()
  let dirty = false

  // Migrate: ensure profile exists
  if (!data.profile) {
    data.profile = { ...DEFAULT_PROFILE }
    dirty = true
  }

  // Seed default admin
  if (!data.admins.find((a) => a.username === 'MajaSaveva')) {
    // Remove any old default admin
    data.admins = data.admins.filter((a) => a.username !== 'admin')
    data.admins.push({
      id: data.nextId.admins++,
      username: 'MajaSaveva',
      password: bcrypt.hashSync('BratMiECar', 10),
    })
    dirty = true
    console.log('Admin created  →  username: MajaSaveva')
  }

  if (dirty) writeData(data)
}

module.exports = { readData, writeData, initDb }
