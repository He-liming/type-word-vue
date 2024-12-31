<template>
  <!-- 新增的最外层容器，设置自适应屏幕大小-->
  <div class="outer-container">
    <!-- 新增的控制box，用于放置el-dropdown和模式切换相关组件 -->
    <div class="control-box">
      <!-- el-dropdown组件，用于菜单按钮 -->
      <el-dropdown placement="top-start">
        <el-button @click="toggleDropdown" @mouseenter="showDropdownOnHover"
          @mouseleave="hideDropdownOnLeave">菜单</el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>
              <p @click="handleFileUpload">上传</p>
              <input type="file" ref="fileInput" style="display: none" accept=".txt" />
            </el-dropdown-item>
            <el-dropdown-item @click="showDialog">
              词库
            </el-dropdown-item>
            <el-dropdown-item @click="handleEndClick">结束</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- 模式切换相关组件，使用el-radio-group和el-radio实现 -->
      <el-tooltip effect="dark" content="选择测试模式，注意这会重新载入单词" placement="top">
        <el-radio-group v-model="showMode" @change="handleShowModeChange">
          <el-radio :label="0">顺序</el-radio>
          <el-radio :label="1">乱序</el-radio>
          <el-radio :label="2">A-Z排序</el-radio>
        </el-radio-group>
      </el-tooltip>
    </div>
    <div class="page-wrapper">
      <el-card class="main-card">
        <el-container>
          <el-header class="header">
            <h1>{{ currentWordBookTitle }}</h1>
          </el-header>
          <el-main class="main-content">
            <div class="mean-box">
              <p>{{ currentChineseMeaning }}</p>
            </div>
            <input placeholder="Type the English word here" :value="inputValue" @input="handleInput" class="english-input"
              v-if="isFileUploaded" @keydown.enter="checkWord" :style="{ display: inputBoxVisible ? 'block' : 'none' }" />
            <el-tooltip effect="light" content="下载错误单词本" placement="top">
              <el-button v-if="downloadButtonVisible" type="success" @click="downloadWords">下载</el-button>
            </el-tooltip>
          </el-main>
          <el-footer class="footer">
            <div class="progress-bar-wrapper">
              <div class="progress-bar-container">
                <div class="progress-bar" :style="{ width: progressWidth }"></div>
              </div>
              <div class="progress-text">{{ completedWords }} / {{ totalWords }}</div>
            </div>
          </el-footer>
        </el-container>
      </el-card>
    </div>

    <!-- el-dialog组件，用于显示弹出的对话框 -->
    <el-dialog title="新概念词库" v-model="dialogVisible">
      <ul class="dialog-list">
        <li @click="handleListItemClick('nce1')">新概念第1册（新版）</li>
        <li @click="handleListItemClick('nce2')">新概念第2册（新版）</li>
        <li @click="handleListItemClick('nce3')">新概念第3册（新版）</li>
        <li @click="handleListItemClick('nce4')">新概念第4册（新版）</li>
        <li @click="handleListItemClick('IELTS1')">雅思词汇真经（新版）</li>
        <li @click="handleListItemClick('IELTS2')">100个句子记完7000个雅思单词</li>
      </ul>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { ElButton, ElTooltip, ElMessage, ElRadioGroup, ElRadio } from 'element-plus';

const inputValue = ref('');
const currentChineseMeaning = ref('请上传单词本开始');
const wordDictionary = ref([]); // 初始化为数组
const usedWords = ref([]);
const fileInput = ref(null);
const isFileUploaded = ref(false);
const wrongCount = ref(0);
const recordedWords = ref([]);
const inputBoxVisible = ref(true);
const progressWidth = ref('0%');
const totalWords = ref(0);
const completedWords = ref(0);
const downloadButtonVisible = ref(false);
// 新增响应式数据，用于记录展示模式，0表示顺序，1表示乱序，2表示A-Z排序，默认乱序
const showMode = ref(1);
// 新增响应式数据，用于存储按当前模式排好序的单词列表
const sortedWordList = ref([]);
// 新增响应式数据，用于控制对话框显示隐藏
const dialogVisible = ref(false);
const currentWordBook = ref('words.txt');
const currentWordBookTitle = ref('新概念第1册');

const handleFileUpload = () => {
  fileInput.value.click();
};

const handleFileSelected = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content.split('\n');
      const dictionary = [];
      lines.forEach((line) => {
        const [word, meaning] = line.split('|');
        if (word && meaning) {
          dictionary.push({ word: word.trim(), meaning: meaning.trim() });
        }
      });
      wordDictionary.value = dictionary;
      totalWords.value = dictionary.length;
      // 重置已完成单词数
      completedWords.value = 0;
      // 重置错误计数
      wrongCount.value = 0;
      // 清空已使用单词列表和记录的单词列表，当作全新开始
      usedWords.value = [];
      recordedWords.value = [];
      // 重置进度条宽度
      progressWidth.value = '0%';
      inputBoxVisible.value = true;
      downloadButtonVisible.value = false;
      sortWordList(); // 按当前模式排序
      showRandomWord();
      isFileUploaded.value = true;
    };
    reader.readAsText(file);
  }
};


// 新增方法，用于根据当前展示模式对单词列表进行排序
const sortWordList = () => {
  const words = wordDictionary.value;
  switch (showMode.value) {
    case 0: // 顺序模式
      sortedWordList.value = words.slice();
      break;
    case 1: // 乱序模式
      sortedWordList.value = words.slice().sort(() => Math.random() - 0.5);
      break;
    case 2: // A-Z排序模式
      sortedWordList.value = words.slice().sort((a, b) => a.word.localeCompare(b.word));
      break;
  }
};

const handleEndClick = () => {
  if (completedWords.value === 0) {
    ElMessage({
      message: `你还未开始测试！`,
      type: 'info',
      duration: 3000
    });
  } else {
    const completedNum = completedWords.value;
    const errors = recordedWords.value.length;
    const accuracy = ((completedNum - errors) / completedNum * 100).toFixed(2);
    currentChineseMeaning.value = `测试结束，本次测试单词数：${completedNum}，错误单词数：${errors}，正确率：${accuracy}%`;
    inputBoxVisible.value = false;
    downloadButtonVisible.value = recordedWords.value.length > 0; // 确保有错误单词时显示下载按钮
  }
};

// 修改showRandomWord方法，直接从排好序的单词列表中按顺序取单词展示
const showRandomWord = () => {
  if (sortedWordList.value.length === 0) {
    if (wordDictionary.value.length === 0) {
      currentChineseMeaning.value = '单词本为空，请重新上传有效文件';
    } else {
      if (recordedWords.value.length === 0) {
        ElMessage({
          message: '卧槽，文曲星下凡，一个都没错！',
          grouping: true,
          type: 'success',
        });
      }
      const completedNum = completedWords.value + 1;
      const errors = recordedWords.value.length;
      const accuracy = ((completedNum - errors) / completedNum * 100).toFixed(2);
      currentChineseMeaning.value = `测试完成，本次测试单词数：${completedNum}，错误单词数：${errors}，正确率：${accuracy}%`;
      inputBoxVisible.value = false;
      progressWidth.value = '100%';
      downloadButtonVisible.value = recordedWords.value.length > 0;
    }
    return;
  }

  // 从已排序列表中取出下一个单词
  const currentItem = sortedWordList.value.shift();

  // 更新当前单词的中文释义
  currentChineseMeaning.value = currentItem.meaning;

  // 更新进度条
  updateProgressBar();

  // 重置错误计数
  wrongCount.value = 0;

  console.log(`当前展示单词: ${currentItem.word}, 释义: ${currentItem.meaning}`);
};

const handleInput = (e) => {
  inputValue.value = e.target.value;
};

const checkWord = () => {
  const inputWord = inputValue.value.trim();
  const currentItem = wordDictionary.value.find(
    (item) => item.meaning === currentChineseMeaning.value
  );

  if (inputWord.toLowerCase() === currentItem?.word.toLowerCase()) {
    // 答对逻辑
    usedWords.value.push(currentItem);
    showRandomWord();
    inputValue.value = '';
    wrongCount.value = 0;
    completedWords.value++;
    document.querySelector('.english-input').style.color = 'red';
  } else {
    // 答错逻辑
    wrongCount.value++;
    if (wrongCount.value === 3) {
      ElMessage({
        message: 'Tips：按下Tab键会有奇迹哦',
        grouping: true,
        type: 'error',
      });
      document.querySelector('.english-input').style.color = 'gray';
    } else if (wrongCount.value > 3) {
      document.querySelector('.english-input').style.color = 'gray';
    }

    // 抖动动画
    const englishInput = document.querySelector('.english-input');
    if (englishInput) {
      englishInput.classList.add('shake');
      setTimeout(() => {
        englishInput.classList.remove('shake');
      }, 500);
    }
  }

  updateProgressBar();
};

// 假设这是在setup函数内部
const dropdownRef = ref(null);
const toggleDropdown = () => {
  dropdownRef.value && dropdownRef.value.toggleDropdown();
};
const showDropdownOnHover = () => {
  dropdownRef.value && dropdownRef.value.show();
};
const hideDropdownOnLeave = () => {
  dropdownRef.value && dropdownRef.value.hide();
};

const downloadWords = () => {
  const content = recordedWords.value.map(item => item).join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recorded_words.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


const updateProgressBar = () => {
  const progressPercent = (completedWords.value / totalWords.value) * 100;
  progressWidth.value = `${progressPercent}%`;
};

// 修改handleShowModeChange方法，重置相关变量并重新进行单词排序和展示
const handleShowModeChange = () => {
  // 重置已完成单词数
  completedWords.value = 0;
  // 重置错误计数
  wrongCount.value = 0;
  // 清空已使用单词列表和记录的单词列表，当作全新开始
  usedWords.value = [];
  recordedWords.value = [];
  // 重置进度条宽度
  progressWidth.value = '0%';
  inputBoxVisible.value = true;
  // 重新进行单词排序
  sortWordList();
  showRandomWord();
};

// 新增方法，用于处理对话框里列表项的点击事件
const handleListItemClick = (option) => {
  // 根据点击的选项设置对应的文件名到currentWordBook
  if (option === 'nce1') {
    currentWordBook.value = 'nce1';
    currentWordBookTitle.value = '新概念第1册';
  } else if (option === 'nce2') {
    currentWordBook.value = 'nce2';
    currentWordBookTitle.value = '新概念第2册';
  } else if (option === 'nce3') {
    currentWordBook.value = 'nce3';
    currentWordBookTitle.value = '新概念第3册';
  } else if (option === 'nce4') {
    currentWordBook.value = 'nce4';
    currentWordBookTitle.value = '新概念第4册';
  } else if (option === 'IELTS1') {
    currentWordBook.value = 'IELTS1';
    currentWordBookTitle.value = '雅思词汇真经';
  } else if (option === 'IELTS2') {
    currentWordBook.value = 'IELTS100';
    currentWordBookTitle.value = '100个句子记完7000个雅思单词';
  }
  // 重新读取对应单词书文件的数据（这里需要调整fetch的路径和文件名拼接等，以下是示例思路）
  const filePath = `/type-words/${currentWordBook.value}.txt`;
  fetch(filePath)
    .then((response) => response.text())
    .then((content) => {
      const lines = content.split('\n');
      const dictionary = [];
      lines.forEach((line) => {
        const [word, meaning] = line.split('|');
        console.log({ word: word.trim(), meaning: meaning.trim() })
        dictionary.push({ word: word.trim(), meaning: meaning.trim() });
      });
      wordDictionary.value = dictionary;
      totalWords.value = dictionary.length;
      inputValue.value = '';
      sortWordList();
      showRandomWord();
      isFileUploaded.value = true;
      handleShowModeChange()

    })
    .catch((e) => {
      console.log(e);
      ElMessage({
        message: '单词书读取失败！',
        grouping: true,
        type: 'error',
      });
    });
  // 关闭弹出框
  dialogVisible.value = false;
};

// 新增方法，用于显示对话框
const showDialog = () => {
  dialogVisible.value = true;
};

let keydownListener;
onMounted(() => {
  fileInput.value.addEventListener('change', handleFileSelected);
  const defaultFile = '/type-words/nce1.txt'; // 假设文件名为words.txt，路径相对于根路径（public目录下）
  fetch(defaultFile)
    .then((response) => response.text())
    .then((content) => {
      const lines = content.split('\n');
      const dictionary = [];
      lines.forEach((line) => {
        const [word, meaning] = line.split('|');
        dictionary.push({ word: word.trim(), meaning: meaning.trim() });
      });
      wordDictionary.value = dictionary;
      totalWords.value = dictionary.length;
      sortWordList();
      showRandomWord();
      isFileUploaded.value = true;
    })
    .catch(() => {
      ElMessage({
        message: '单词书读取失败！',
        grouping: true,
        type: 'error',
      });
    });

  keydownListener = (e) => {
    const englishInput = document.querySelector('.english-input');
    if (e.key === 'Tab' && englishInput === document.activeElement) {
      e.preventDefault();
      const currentItem = wordDictionary.value.find(
        (item) => item.meaning === currentChineseMeaning.value
      );
      if (currentItem && !recordedWords.value.some((wordInfo) => wordInfo.startsWith(currentItem.word))) {
        inputValue.value = currentItem.word;
        recordedWords.value.push(`${currentItem.word}|${currentItem.meaning}`);
      }
      // 使用nextTick确保在数据更新后设置焦点
      nextTick(() => {
        englishInput.focus();
      });
    }
  };
  document.addEventListener('keydown', keydownListener);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', keydownListener);
});
</script>

<style scoped>
/* 新增的最外层容器样式，设置宽高为100% */
.outer-container {
  width: 100%;
  height: 100%;
  background-color: #f4f7fc;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}

/* 新增控制box的样式规则 */
.control-box {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

/* 新增el-radio-group和el-radio的样式规则 */
.el-radio-group {
  display: flex;
  gap: 10px;
}

.el-radio {
  font-size: 14px;
  color: #303133;
}

/* 页面整体布局相关样式 */
.page-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
}

.main-card {
  width: 60%;
  box-sizing: border-box;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.15), 0 12px 48px rgba(0, 0, 0, 0.1);
  border: none;
  transition: box-shadow 0.5s ease, transform 0.5s ease;
  border-radius: 20px;
  transform: scale(1);
}

.main-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 16px 48px rgba(0, 0, 0, 0.25), 0 24px 72px rgba(0, 0, 0, 0.2);
  transform: scale(1.01);
}

.header {
  text-align: center;
  padding: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 70px;
  color: #4CAF50;
  font-weight: bold;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
  letter-spacing: 10px;
}

.main-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.footer {
  text-align: center;
  padding: 30px 0;
}

.mean-box {
  width: 80%;
  text-align: center;
  font-size: 50px;
  font-family: "KaiTi", "行楷", serif;
  padding: 20px;
  color: #333333;
}

.english-input {
  width: 80%;
  padding: 8px 12px;
  border: none;
  border-bottom: 3px solid red;
  font-size: 50px;
  text-align: center;
  font-family: "Consolas", monospace;
  color: red;
  outline: none;
}

.english-input::placeholder {
  color: rgba(128, 128, 128, 0.5);
}

.shake {
  animation: shake 0.5s cubic-bezier(0.2, 0.1, 0.3, 1);
}

@keyframes shake {
  0% {
    transform: translateX(0) translateY(0);
  }

  10% {
    transform: translateX(-5px) translateY(-2px);
  }

  20% {
    transform: translateX(5px) translateY(2px);
  }

  30% {
    transform: translateX(-3px) translateY(-1px);
  }

  40% {
    transform: translateX(3px) translateY(1px);
  }

  50% {
    transform: translateX(-2px) translateY(-0.5px);
  }

  60% {
    transform: translateX(2px) translateY(0.5px);
  }

  70% {
    transform: translateX(-1px) translateY(-0.3px);
  }

  80% {
    transform: translateX(1px) translateY(0.3px);
  }

  90% {
    transform: translateX(-0.5px) translateY(-0.1px);
  }

  100% {
    transform: translateX(0) translateY(0);
  }
}

.progress-bar-wrapper {
  width: 80%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-bar-container {
  width: 100%;
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #4CAF50;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 16px;
  color: #333;
  margin-top: 5px;
}

/* 媒体查询，针对小屏设备（最大宽度768px） */
@media screen and (max-width: 768px) {

  .outer-container {
    width: 100%;
    height: 100%;
    background-color: #f4f7fc;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
  }

  /* 控制box在小屏下调整样式 */
  .control-box {
    gap: 10px;
    padding: 10px;
  }

  /* el-card（main-card）在小屏下的样式调整 */
  .main-card {
    width: 90%;
    /* 占满屏幕宽度 */
    border-radius: 10px;
    /* 适当缩小圆角半径 */
  }

  /* 标题部分样式调整 */
  .header {
    padding: 20px;
    /* 调整内边距 */
    font-size: 1.5rem;
    /* 缩小字体大小 */
  }

  /* 主要内容区域样式调整 */
  .main-content {
    /* padding: 10px; 调整内边距 */
    gap: 20px;
    /* 调整元素间间距 */
  }

  /* 单词释义框样式调整 */
  .mean-box {
    width: 90%;
    /* 占满宽度 */
    font-size: 1rem;
    /* 缩小字体大小 */
    padding: 10px;
    /* 调整内边距 */
  }

  /* 英文输入框样式调整 */
  .english-input {
    width: 90%;
    /* 占满宽度 */
    font-size: 1rem;
    /* 缩小字体大小 */
    padding: 8px;
    /* 调整内边距 */
    padding-top: 30px;
  }

  .progress-bar-container {
    height: 3px;
    overflow: hidden;
  }

  .progress-text {
    font-size: 0.8rem;
    /* 缩小字体大小 */
  }

  .dialog-list {
    list-style-type: none;
    /* 去掉默认的列表样式 */
    padding: 0;
    margin: 0;
  }

  .el-dialog {
    /* width: 90% !important; */
    /* 对话框宽度为屏幕的90% */
    max-width: 400px;
    /* 最大宽度为400px */
    margin: 20px auto;
    /* 居中 */
    border-radius: 10px;
    /* 保持圆角样式 */
    padding: 10px;
  }

  .el-dialog__header {
    font-size: 18px;
    /* 减小标题字体大小 */
    padding: 10px;
    /* 减少内边距 */
  }

  .el-dialog__body {
    font-size: 14px;
    /* 调整正文字体大小 */
    padding: 10px;
    /* 减少正文的内边距 */
    max-height: 250px;
    /* 限制高度为250px */
  }

  .dialog-list li {
    font-size: 16px;
    /* 列表项字体大小略微调小 */
    padding: 8px 10px;
    /* 减少列表项的内外边距 */
    margin: 5px 0;
    /* 缩小间隔 */
  }
}

.dialog-list {
  list-style-type: none;
  /* 去掉默认的列表样式 */
  padding: 0;
  margin: 0;
}

.dialog-list li {
  padding: 10px 15px;
  margin: 5px 0;
  border-radius: 8px;
  background-color: #f9f9f9;
  color: #333;
  font-size: 18px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  /* 增加过渡动画 */
}

.dialog-list li:hover {
  background-color: #4CAF50;
  /* 悬停时背景色变绿 */
  color: white;
  /* 悬停时字体颜色变白 */
  transform: scale(1.05);
  /* 悬停时略微放大 */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  /* 增加阴影效果 */
}

.el-dialog {
  border-radius: 10px;
  /* 对话框整体增加圆角 */
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  /* 增加阴影效果 */
  transition: transform 0.3s ease, opacity 0.3s ease;
  /* 弹出动画效果 */
}

.el-dialog__header {
  font-size: 20px;
  /* 增加标题的字体大小 */
  font-weight: bold;
  /* 标题加粗 */
  text-align: center;
  /* 标题居中 */
  background-color: #4CAF50;
  /* 标题背景色为绿色 */
  color: white;
  /* 标题文字颜色为白色 */
  padding: 15px;
  /* 增加内边距 */
  border-radius: 10px 10px 0 0;
  /* 标题部分与对话框圆角匹配 */
}

.el-dialog__body {
  padding: 20px;
  /* 增加内容区域的内边距 */
  max-height: 300px;
  /* 限制内容区域最大高度 */
  overflow-y: auto;
  /* 当内容超出时增加滚动条 */
}

.el-dialog__footer {
  text-align: center;
  /* 底部居中对齐 */
  padding: 15px;
  /* 增加内边距 */
  border-top: 1px solid #ddd;
  /* 增加分隔线 */
}
</style>