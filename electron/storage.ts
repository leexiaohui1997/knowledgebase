import { app } from 'electron'
import fs from 'fs'
import path from 'path'

// 获取数据存储路径
export function getStoragePath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'data.json')
}

// 读取数据
export function readData(): any {
  try {
    const filePath = getStoragePath()
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    }
    return { knowledgeBases: [], documents: [] }
  } catch (error) {
    console.error('Error reading data:', error)
    return { knowledgeBases: [], documents: [] }
  }
}

// 保存数据
export function writeData(data: any): void {
  try {
    const filePath = getStoragePath()
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing data:', error)
  }
}

