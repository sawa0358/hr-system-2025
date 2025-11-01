#!/usr/bin/env node
// 毎日実行する想定の簡易スクリプト。稼働中アプリの /api/vacation/schedule/daily を叩く
const http = require('http')

const host = process.env.CRON_TARGET_HOST || 'localhost'
const port = process.env.CRON_TARGET_PORT || '3000'

const options = {
  hostname: host,
  port: port,
  path: '/api/vacation/schedule/daily',
  method: 'POST',
}

const req = http.request(options, (res) => {
  let data = ''
  res.on('data', (chunk) => (data += chunk))
  res.on('end', () => {
    console.log('Daily scheduler response:', data)
  })
})

req.on('error', (e) => {
  console.error('Scheduler request error:', e)
})

req.end()


