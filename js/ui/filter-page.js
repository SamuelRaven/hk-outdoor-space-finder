/* ========================================
   Filter Page — 筛选页
   状态机管理四个筛选器 + GO + 盲盒
   ======================================== */

import { navigate, register } from '../core/router.js?v=4';
import { matchParks } from '../core/matcher.js?v=4';

// ---- 选项定义 ----
const REGIONS = ['港島', '九龍', '新界'];
const TIMES = ['清晨', '上午', '中午', '下午', '傍晚', '夜晚'];
const PARK_TYPES = ['海濱長廊', '市區公園', '郊野綠地', '主題園林', '休憩花園'];
const ACTIVITIES = ['散步看景', '親子放電', '運動出汗', '開爐野餐', '寵物出行', '安靜發呆'];

// ---- 选中底色：时间/地区/类型/活动固定映射，小区按序循环（紫橙绿红黄蓝青绿，青绿与绿不相邻） ----
const TIME_COLORS = { '清晨': 'green', '上午': 'blue', '中午': 'orange', '下午': 'yellow', '傍晚': 'purple', '夜晚': 'black' };
const REGION_COLORS = { '港島': 'blue', '九龍': 'red', '新界': 'yellow' };
const PARK_TYPE_COLORS = { '海濱長廊': 'blue', '市區公園': 'purple', '郊野綠地': 'green', '主題園林': 'teal', '休憩花園': 'orange' };
const ACTIVITY_COLORS = { '散步看景': 'blue', '親子放電': 'teal', '運動出汗': 'orange', '開爐野餐': 'yellow', '寵物出行': 'green', '安靜發呆': 'purple' };
const DISTRICT_COLORS = ['purple', 'orange', 'green', 'red', 'yellow', 'blue', 'teal'];

// ---- 状态 ----
let districtsData = {};
let parks = [];
let state = {};
let filterGrid, optionsContainer;
let activePanel = null;

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

  // 加载公园数据（用于交叉筛选兼容性检查）
  if (parks.length === 0) {
    fetch('js/data/parks.json?v=6')
      .then(r => r.json())
      .then(data => {
        parks = data;
        if (activePanel && optionsContainer.children.length > 0) {
          handleFilterTap(activePanel);
        }
        updateFilterBtnStates();
      })
      .catch(err => console.error('加载 parks.json 失败:', err));
  }

  // 返回按钮
  section.querySelector('[data-action="back"]').addEventListener('click', () => {
    navigate('#/');
  });

  // GO! 按钮
  section.querySelector('[data-action="go"]').addEventListener('click', () => {
    if (!state.region && !state.time && !state.parkType && !state.activity) {
      import('./toast.js').then(m => {
        m.showToast('請至少選擇一個篩選條件');
      });
      return;
    }
    if (parks.length > 0 && matchParks(parks, state).length === 0) {
      import('./toast.js').then(m => {
        m.showToast('沒有符合條件的公園<br>試試調整篩選條件吧');
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
    activePanel = null;
    resetAllFilterBtns();
    optionsContainer.innerHTML = '';
    updateFilterBtnStates();
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
  activePanel = filterName;
  switch (filterName) {
    case 'region':   showRegionOptions(); break;
    case 'time':     showTimeOptions(); break;
    case 'parkType': showParkTypeOptions(); break;
    case 'activity': showActivityOptions(); break;
  }
}

// ---- 交叉筛选兼容性 ----
function getIncompatibleOptions(groupKey) {
  const incompatible = new Set();
  if (parks.length === 0) return incompatible;

  const optionLists = { region: REGIONS, time: TIMES, parkType: PARK_TYPES, activity: ACTIVITIES };
  const options = optionLists[groupKey];
  if (!options) return incompatible;

  // 检查其他筛选组是否有已选项
  const otherKeys = Object.keys(optionLists).filter(k => k !== groupKey);
  const hasOtherSelections = otherKeys.some(k => state[k]);
  if (!hasOtherSelections) return incompatible;

  for (const option of options) {
    if (option === state[groupKey]) continue;
    const testState = { ...state, [groupKey]: option };
    if (groupKey === 'region') testState.district = null;
    if (matchParks(parks, testState).length === 0) incompatible.add(option);
  }
  return incompatible;
}

// ---- 更新顶部筛选按钮 disabled 状态 ----
function updateFilterBtnStates() {
  const dims = ['region', 'time', 'parkType', 'activity'];
  const optionLists = { region: REGIONS, time: TIMES, parkType: PARK_TYPES, activity: ACTIVITIES };
  if (parks.length === 0) return;
  dims.forEach(k => {
    const incompatible = getIncompatibleOptions(k);
    const btn = filterGrid.querySelector(`[data-filter="${k}"]`);
    if (btn) btn.disabled = (incompatible.size === optionLists[k].length);
  });
}

// ---- 地区选项 ----
function showRegionOptions() {
  optionsContainer.innerHTML = '';
  const incompatible = getIncompatibleOptions('region');

  REGIONS.forEach(region => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (region === state.region) chip.classList.add('chip--selected', 'chip--c-' + REGION_COLORS[region]);
    if (incompatible.has(region)) { chip.disabled = true; chip.classList.add('chip--disabled'); }
    chip.textContent = region;
    chip.addEventListener('click', () => {
      if (chip.disabled) return;
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

  if (state.region && districtsData[state.region] && districtsData[state.region].length > 0) {
    const divider = document.createElement('div');
    divider.className = 'filter-options__divider';
    optionsContainer.appendChild(divider);

    districtsData[state.region].forEach((district, i) => {
      // 地区兼容性：当前已选其他筛选 + 此地区
      let districtIncompatible = false;
      if (parks.length > 0) {
        const otherKeys = ['time', 'parkType', 'activity'];
        const hasOther = otherKeys.some(k => state[k]);
        if (hasOther) {
          const testState = { ...state, district: district };
          if (matchParks(parks, testState).length === 0) districtIncompatible = true;
        }
      }

      const chip = document.createElement('button');
      chip.className = 'chip';
      if (district === state.district) chip.classList.add('chip--selected', 'chip--c-' + DISTRICT_COLORS[i % DISTRICT_COLORS.length]);
      if (districtIncompatible && district !== state.district) { chip.disabled = true; chip.classList.add('chip--disabled'); }
      chip.textContent = district;
      chip.addEventListener('click', () => {
        if (chip.disabled) return;
        state.district = (district === state.district) ? null : district;
        updateDistrictDisplay();
        showRegionOptions();
      });
      optionsContainer.appendChild(chip);
    });
  }
  updateFilterBtnStates();
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
  const incompatible = getIncompatibleOptions('time');
  TIMES.forEach(time => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (time === state.time) chip.classList.add('chip--selected', 'chip--c-' + TIME_COLORS[time]);
    if (incompatible.has(time)) { chip.disabled = true; chip.classList.add('chip--disabled'); }
    chip.textContent = time;
    chip.addEventListener('click', () => {
      if (chip.disabled) return;
      state.time = (time === state.time) ? null : time;
      updateFilterBtn('time', state.time || '選擇');
      showTimeOptions();
    });
    optionsContainer.appendChild(chip);
  });
  updateFilterBtnStates();
}

// ---- 公园类型选项 ----
function showParkTypeOptions() {
  optionsContainer.innerHTML = '';
  const incompatible = getIncompatibleOptions('parkType');
  PARK_TYPES.forEach((pt, i) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (pt === state.parkType) chip.classList.add('chip--selected', 'chip--c-' + PARK_TYPE_COLORS[pt]);
    if (incompatible.has(pt)) { chip.disabled = true; chip.classList.add('chip--disabled'); }
    chip.textContent = pt;
    chip.addEventListener('click', () => {
      if (chip.disabled) return;
      state.parkType = (pt === state.parkType) ? null : pt;
      updateFilterBtn('parkType', state.parkType || '選擇');
      showParkTypeOptions();
    });
    optionsContainer.appendChild(chip);
  });
  updateFilterBtnStates();
}

// ---- 做点什么选项 ----
function showActivityOptions() {
  optionsContainer.innerHTML = '';
  const incompatible = getIncompatibleOptions('activity');
  ACTIVITIES.forEach((act, i) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (act === state.activity) chip.classList.add('chip--selected', 'chip--c-' + ACTIVITY_COLORS[act]);
    if (incompatible.has(act)) { chip.disabled = true; chip.classList.add('chip--disabled'); }
    chip.textContent = act;
    chip.addEventListener('click', () => {
      if (chip.disabled) return;
      state.activity = (act === state.activity) ? null : act;
      updateFilterBtn('activity', state.activity || '選擇');
      showActivityOptions();
    });
    optionsContainer.appendChild(chip);
  });
  updateFilterBtnStates();
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
