import { NextRequest, NextResponse } from 'next/server'
import { uploadFileToS3, getSignedDownloadUrl } from '@/lib/s3-client'
import type { UserSettings } from '@/lib/settings-sync'

/**
 * ユーザー設定のAPIエンドポイント
 * GET: S3から設定を取得
 * POST: S3に設定を保存
 */

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-employee-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      )
    }
    
    console.log('ユーザー設定取得リクエスト:', userId)
    
    const fileName = `user-settings-${userId}.json`
    const filePath = `user-settings/${fileName}`
    
    const result = await getSignedDownloadUrl(filePath)
    
    if (!result.success || !result.url) {
      console.log('S3から設定ファイルが見つかりません:', userId)
      return NextResponse.json(
        { success: false, error: '設定ファイルが見つかりません' },
        { status: 404 }
      )
    }
    
    const response = await fetch(result.url)
    if (!response.ok) {
      console.error('設定ファイルの取得に失敗:', response.status)
      return NextResponse.json(
        { success: false, error: '設定ファイルの取得に失敗しました' },
        { status: 500 }
      )
    }
    
    const settings: UserSettings = await response.json()
    console.log('S3からユーザー設定を取得しました:', userId)
    
    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error('ユーザー設定取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-employee-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    if (!body.settings) {
      return NextResponse.json(
        { error: '設定データが必要です' },
        { status: 400 }
      )
    }
    
    console.log('ユーザー設定保存リクエスト:', userId)
    
    const settingsData = JSON.stringify(body.settings, null, 2)
    const buffer = Buffer.from(settingsData, 'utf-8')
    
    const fileName = `user-settings-${userId}.json`
    const folder = 'user-settings'
    
    const result = await uploadFileToS3(
      buffer,
      fileName,
      'application/json',
      folder
    )
    
    if (result.success) {
      console.log(`ユーザー設定をS3に保存しました: ${userId}`)
      return NextResponse.json({
        success: true,
        message: '設定を保存しました'
      })
    } else {
      console.error('S3への設定保存に失敗:', result.error)
      return NextResponse.json(
        { error: result.error || '設定の保存に失敗しました' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('ユーザー設定保存エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}