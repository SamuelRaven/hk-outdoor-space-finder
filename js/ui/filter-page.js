/* ========================================
   Filter Page — 筛选页
   状态机管理四个筛选器 + GO + 盲盒
   ======================================== */

import { navigate, register } from '../core/router.js?v=4';

// ---- 选项定义 ----
const REGIONS = ['港島', '九龍', '新界'];
const TIMES = ['清晨', '上午', '中午', '下午', '傍晚', '夜晚'];
const PARK_TYPES = ['海濱長廊', '市區公園', '郊野綠地', '主題園林', '休憩花園'];
const ACTIVITIES = ['散步看景', '親子放電', '運動出汗', '寵物出行', '安靜發呆'];

// ---- 状态 ----
let districtsData = {};
let state = {};
let filterGrid, optionsContainer;

// ---- 创建初始状态 ----
function createInitialState() {
  return {
    region: null,
    district: null,
    time: null,
    parkType: null,
    activity: null,
  };
}

// ---- 初始化 ----
function init() {
  const section = document.getElementById('page-filter');
  filterGrid = section.querySelector('.filter-grid');
  optionsContainer = document.getElementById('filter-options');

  // 重置状态
  state = createInitialState();
  resetAllFilterBtns();
  optionsContainer.innerHTML = '';

  // 加载地区数据
  fetch('js/data/districts.json')
    .then(r => r.json())
    .then(data => { districtsData = data; })
    .catch(err => console.error('加载 districts.json 失败:', err));

  // 返回按钮
  section.querySelector('[data-action="back"]').addEventListener('click', () => {
    navigate('#/');
  });

  // GO! 按钮
  section.querySelector('[data-action="go"]').addEventListener('click', () => {
    if (!state.region && !state.time && !state.parkType && !state.activity) {
      import('./toast.js').then(m => {
        m.showToast('請至少選擇一個篩選條件～');
      });
      return;
    }
    window.__appState = window.__appState || {};
    window.__appState.filters = { ...state };
    sessionStorage.setItem('parkFilters', JSON.stringify(state));
    navigate('#/results');
  });

  // 盲盒按钮
  section.querySelector('[data-action="blindbox"]').addEventListener('click', () => {
    navigate('#/blindbox');
  });

  // 收藏按钮
  section.querySelector('[data-action="fav-parks"]').addEventListener('click', () => {
    navigate('#/fav-parks');
  });

  // Reset! 按钮
  section.querySelector('[data-action="reset"]').addEventListener('click', () => {
    state = createInitialState();
    resetAllFilterBtns();
    optionsContainer.innerHTML = '';
  });

  // 筛选按钮点击
  filterGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn || btn.disabled) return;
    handleFilterTap(btn.dataset.filter);
  });
}

function destroy() {
  // 离开时不清空，由 init 负责重置
}

// ---- 筛选器分发 ----
function handleFilterTap(filterName) {
  switch (filterName) {
    case 'region':   showRegionOptions(); break;
    case 'time':     showTimeOptions(); break;
    case 'parkType': showParkTypeOptions(); break;
    case 'activity': showActivityOptions(); break;
  }
}

// ---- 地区选项 ----
function showRegionOptions() {
  optionsContainer.innerHTML = '';

  REGIONS.forEach(region => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (region === state.region) chip.classList.add('chip--selected');
    chip.textContent = region;
    chip.addEventListener('click', () => {
      if (region === state.region) {
        state.region = null;
        state.district = null;
        updateFilterBtn('region', '選擇');
      } else {
        state.region = region;
        state.district = null;
        updateFilterBtn('region', region);
      }
      showRegionOptions();
    });
    optionsContainer.appendChild(chip);
  });

  if (state.region && districtsData[state.region]) {
    const divider = document.createElement('div');
    divider.className = 'filter-options__divider';
    optionsContainer.appendChild(divider);

    districtsData[state.region].forEach(district => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      if (district === state.district) chip.classList.add('chip--selected');
      chip.textContent = district;
      chip.addEventListener('click', () => {
        state.district = (district === state.district) ? null : district;
        updateDistrictDisplay();
        showRegionOptions();
      });
      optionsContainer.appendChild(chip);
    });
  }
}

function updateDistrictDisplay() {
  const label = state.district
    ? `${state.region} — ${state.district}`
    : (state.region || '選擇');
  updateFilterBtn('region', label);
}

// ---- 时间选项 ----
function showTimeOptions() {
  optionsContainer.innerHTML = '';
  TIMES.forEach(time => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (time === state.time) chip.classList.add('chip--selected');
    chip.textContent = time;
    chip.addEventListener('click', () => {
      state.time = (time === state.time) ? null : time;
      updateFilterBtn('time', state.time || '選擇');
      showTimeOptions();
    });
    optionsContainer.appendChild(chip);
  });
}

// ---- 公园类型选项 ----
function showParkTypeOptions() {
  optionsContainer.innerHTML = '';
  PARK_TYPES.forEach(pt => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (pt === state.parkType) chip.classList.add('chip--selected');
    chip.textContent = pt;
    chip.addEventListener('click', () => {
      state.parkType = (pt === state.parkType) ? null : pt;
      updateFilterBtn('parkType', state.parkType || '選擇');
      showParkTypeOptions();
    });
    optionsContainer.appendChild(chip);
  });
}

// ---- 做点什么选项 ----
function showActivityOptions() {
  optionsContainer.innerHTML = '';
  ACTIVITIES.forEach(act => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (act === state.activity) chip.classList.add('chip--selected');
    chip.textContent = act;
    chip.addEventListener('click', () => {
      state.activity = (act === state.activity) ? null : act;
      updateFilterBtn('activity', state.activity || '選擇');
      showActivityOptions();
    });
    optionsContainer.appendChild(chip);
  });
}

// ---- 更新筛选按钮文字 ----
function updateFilterBtn(filterName, displayValue) {
  const btn = filterGrid.querySelector(`[data-filter="${filterName}"]`);
  if (btn) {
    btn.querySelector('.filter-btn__value').textContent = displayValue;
    btn.dataset.selected = displayValue !== '選擇' ? 'true' : '';
  }
}

// ---- 重置所有筛选按钮 ----
function resetAllFilterBtns() {
  updateFilterBtn('region', '選擇');
  updateFilterBtn('time', '選擇');
  updateFilterBtn('parkType', '選擇');
  updateFilterBtn('activity', '選擇');
}

// ---- 注册路由 ----
register('page-filter', init, destroy);
