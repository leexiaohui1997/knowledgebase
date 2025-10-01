import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isWeb = mode === 'web'
  
  return {
    plugins: [
      vue(),
      // 只在非 Web 模式下启用 Electron 插件
      ...(!isWeb ? [
        electron([
          {
            entry: 'electron/main.ts',
            onstart(args) {
              // 使用 restart 而不是 startup，避免多实例
              if (args.startup) {
                args.startup()
              } else {
                args.reload()
              }
            },
            vite: {
              build: {
                outDir: 'dist-electron',
                rollupOptions: {
                  external: ['electron']
                }
              }
            }
          },
          {
            entry: 'electron/preload.ts',
            onstart(args) {
              args.reload()
            },
            vite: {
              build: {
                outDir: 'dist-electron'
              }
            }
          }
        ]),
        renderer()
      ] : [])
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 5173
    },
    base: isWeb ? '/knowledgebase/' : '/',  // Web 版 GitHub Pages 路径
    build: {
      outDir: isWeb ? 'dist-web' : 'dist'  // Web 版输出到 dist-web
    }
  }
})

