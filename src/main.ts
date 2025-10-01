import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'

// Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faBook,
  faBookOpen,
  faFolder,
  faFolderOpen,
  faFile,
  faFileLines,
  faPlus,
  faTrash,
  faPenToSquare,
  faArrowLeft,
  faFloppyDisk,
  faEye,
  faMagnifyingGlass,
  faBoxArchive,
  faLightbulb,
  faRocket,
  faStar,
  faBullseye,
  faBolt,
  faFire,
  faBriefcase
} from '@fortawesome/free-solid-svg-icons'

// 添加图标到库
library.add(
  faBook,
  faBookOpen,
  faFolder,
  faFolderOpen,
  faFile,
  faFileLines,
  faPlus,
  faTrash,
  faPenToSquare,
  faArrowLeft,
  faFloppyDisk,
  faEye,
  faMagnifyingGlass,
  faBoxArchive,
  faLightbulb,
  faRocket,
  faStar,
  faBullseye,
  faBolt,
  faFire,
  faBriefcase
)

const app = createApp(App)
const pinia = createPinia()

// 注册 Font Awesome 组件
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(pinia)
app.use(router)
app.mount('#app')

