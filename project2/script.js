// =============================================
// 📦 상태 관리: 할 일 목록 데이터 배열
// =============================================

/**
 * todos 배열: 앱의 모든 할 일 항목을 객체 형태로 저장합니다.
 *
 * 각 항목(객체)의 구조:
 *   - id        : Date.now()를 활용한 고유 식별값 (숫자)
 *   - text      : 사용자가 입력한 할 일 내용 (문자열)
 *   - completed : 완료 여부 (기본값 false, 불리언)
 *   - dueDate   : 마감 날짜 (문자열 또는 null)
 */

// 현재 선택된 필터 상태: 'all' | 'active' | 'done'
let currentFilter = 'all';

// 드래그 중인 항목의 id
let dragSrcId = null;

// 리스트 관리 모달 상태
let manageFilter = 'all';
let selectedIds = new Set();

// =============================================
// 💾 localStorage: 저장 / 불러오기
// =============================================

/**
 * saveTodos(): todos 배열을 JSON 문자열로 변환하여 localStorage에 저장
 *
 * localStorage는 문자열만 저장 가능하므로 JSON.stringify()로 변환이 필요합니다.
 * (반대로 불러올 때는 JSON.parse()로 다시 배열/객체로 복원합니다.)
 *
 * 비유: stringify는 "포장", parse는 "개봉" 📦
 */
function saveTodos() {
  localStorage.setItem('my-todos', JSON.stringify(todos));
}

// 페이지 로드 시 localStorage에서 todos 데이터 불러오기
const savedTodosJson = localStorage.getItem('my-todos');
let todos = savedTodosJson ? JSON.parse(savedTodosJson) : [];

// =============================================
// 🗑️ 휴지통 데이터 관리
// =============================================

const savedTrashJson = localStorage.getItem('my-trash');
let trash = savedTrashJson ? JSON.parse(savedTrashJson) : [];

function saveTrash() {
  localStorage.setItem('my-trash', JSON.stringify(trash));
}

// cleanOldTrash(): 30일(2,592,000,000ms) 이상 지난 항목 자동 영구 삭제
function cleanOldTrash() {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const trashCountBefore = trash.length;

  trash = trash.filter(function(trashItem) {
    return (now - trashItem.deletedAt) < THIRTY_DAYS_MS;
  });

  if (trash.length !== trashCountBefore) saveTrash();
}

// 페이지 로드 시 30일 지난 휴지통 항목 자동 정리
cleanOldTrash();

// =============================================
// 📅 D-Day 계산: 마감일까지 남은 날짜 뱃지 반환
// =============================================

function getDDayLabel(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(dueDate);
  const diffDays = Math.round((dueDay - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return { label: '기간 만료', style: 'bg-red-100 text-red-500' };
  if (diffDays === 0) return { label: 'D-Day', style: 'bg-orange-100 text-orange-500 font-semibold' };
  return { label: 'D-' + diffDays, style: 'bg-blue-100 text-blue-500' };
}

// =============================================
// 🖥️ 렌더링: todos 배열 → HTML 목록으로 그리기
// =============================================

/**
 * getFilteredTodos(): 현재 필터 상태에 따라 표시할 todos 배열을 반환
 */
function getFilteredTodos() {
  if (currentFilter === 'active') {
    return todos.filter(function(todo) { return todo.completed === false; });
  }
  if (currentFilter === 'done') {
    return todos.filter(function(todo) { return todo.completed === true; });
  }
  return todos;
}

/**
 * createEditModeUI(li, todo): 편집 모드 UI를 생성하고 이벤트를 연결합니다.
 */
function createEditModeUI(li, todo) {
  const hasDueDate = !!todo.dueDate;

  li.innerHTML = `
    <div class="flex flex-col gap-2 flex-1 min-w-0">
      <input
        type="text"
        value="${todo.text}"
        class="edit-text-input w-full text-sm border border-indigo-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400"
        aria-label="할 일 수정 입력"
      />
      <div class="flex items-center gap-2">
        <input type="checkbox" id="edit-date-toggle-${todo.id}"
          class="w-4 h-4 accent-indigo-500 cursor-pointer edit-date-toggle"
          ${hasDueDate ? 'checked' : ''} />
        <label for="edit-date-toggle-${todo.id}" class="text-xs text-gray-500 cursor-pointer select-none">📅 마감 날짜</label>
        <input type="date" value="${todo.dueDate || ''}"
          class="edit-date-input flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-400 transition ${hasDueDate ? '' : 'hidden'}" />
      </div>
    </div>
    <div class="flex flex-col gap-1 flex-shrink-0">
      <button type="button" class="save-btn text-xs bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors">저장</button>
      <button type="button" class="cancel-btn text-xs bg-gray-100 hover:bg-gray-200 text-gray-500 font-medium px-3 py-1.5 rounded-lg transition-colors">취소</button>
    </div>
  `;

  const editTextInput = li.querySelector('.edit-text-input');
  const editDateToggle = li.querySelector('.edit-date-toggle');
  const editDateInput = li.querySelector('.edit-date-input');

  editTextInput.focus();
  editTextInput.select();

  // 날짜 토글 변경 시 날짜 입력창 표시/숨김
  editDateToggle.addEventListener('change', function() {
    editDateInput.classList.toggle('hidden', !this.checked);
    if (!this.checked) editDateInput.value = '';
  });

  // 저장 버튼 클릭
  li.querySelector('.save-btn').addEventListener('click', function() {
    const newDueDate = editDateToggle.checked && editDateInput.value ? editDateInput.value : null;
    updateTodo(todo.id, editTextInput.value, newDueDate);
  });

  // 취소 버튼 클릭
  li.querySelector('.cancel-btn').addEventListener('click', function() {
    renderTodos();
  });

  // Enter 저장 / Escape 취소
  editTextInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const newDueDate = editDateToggle.checked && editDateInput.value ? editDateInput.value : null;
      updateTodo(todo.id, editTextInput.value, newDueDate);
    }
    if (e.key === 'Escape') renderTodos();
  });
}

/**
 * createTodoItem(todo): 할 일 카드 <li> 요소를 생성하고 이벤트를 연결하여 반환합니다.
 */
function createTodoItem(todo) {
  const isCompleted = todo.completed;

  const li = document.createElement('li');
  li.className = 'bg-white rounded-xl shadow-sm border border-gray-100 px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3'
    + (isCompleted ? ' opacity-60' : '');

  const ddayInfo = todo.dueDate ? getDDayLabel(todo.dueDate) : null;
  const ddayBadgeHtml = ddayInfo
    ? `<span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${ddayInfo.style}">${ddayInfo.label}</span>`
    : '';

  li.innerHTML = `
    <span
      class="drag-handle text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing text-xl flex-shrink-0 select-none leading-none"
      title="드래그하여 순서 변경"
      aria-hidden="true"
    >⠿</span>
    <input
      type="checkbox"
      ${isCompleted ? 'checked' : ''}
      class="w-5 h-5 rounded border-gray-300 accent-indigo-500 cursor-pointer flex-shrink-0"
      aria-label="완료 체크"
    />
    <span class="flex-1 text-sm sm:text-base ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}">
      ${todo.text}
    </span>
    ${ddayBadgeHtml}
    <button
      type="button"
      class="text-gray-300 hover:text-yellow-400 transition-colors text-base leading-none flex-shrink-0"
      aria-label="편집"
    >✏️</button>
    <button
      type="button"
      class="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0"
      aria-label="삭제"
    >✕</button>
  `;

  // 완료 체크박스 이벤트
  li.querySelector('input[type="checkbox"]').addEventListener('change', function() {
    toggleTodo(todo.id);
  });

  // 편집 버튼 이벤트 → 편집 모드 UI로 교체
  li.querySelector('button[aria-label="편집"]').addEventListener('click', function() {
    createEditModeUI(li, todo);
  });

  // 삭제 버튼 이벤트 → 휴지통으로 이동
  li.querySelector('button[aria-label="삭제"]').addEventListener('click', function() {
    moveToTrash(todo.id);
  });

  applyDragEvents(li, todo.id);

  return li;
}

/**
 * renderTodos(): todos 배열을 화면에 렌더링합니다.
 */
function renderTodos() {
  const todoListEl = document.getElementById('todo-list');
  todoListEl.innerHTML = '';

  // 빈 배열 처리
  if (todos.length === 0) {
    todoListEl.innerHTML = `
      <li class="text-center py-12 text-gray-400 list-none">
        <p class="text-4xl mb-3">🗒️</p>
        <p class="text-sm">할 일이 없어요! 📝</p>
      </li>
    `;
    updateStatus();
    return;
  }

  // 필터링된 목록 렌더링
  getFilteredTodos().forEach(function(todo) {
    todoListEl.appendChild(createTodoItem(todo));
  });

  updateStatus();
  updateFilterButtons();
  document.getElementById('manage-area').classList.toggle('hidden', todos.length === 0);
}

// 페이지 로드 시 최초 실행
renderTodos();

// =============================================
// 📊 상태 업데이트: 전체/완료 개수 표시
// =============================================

function updateStatus() {
  const totalCount = todos.length;
  const completedCount = todos.filter(function(todo) {
    return todo.completed === true;
  }).length;

  document.getElementById('total-count').textContent = totalCount;
  document.getElementById('done-count').textContent = completedCount;
}

// =============================================
// 🎨 필터 버튼 강조
// =============================================

function updateFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    const isActive = btn.dataset.filter === currentFilter;
    btn.classList.toggle('bg-indigo-500', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('font-semibold', isActive);
    btn.classList.toggle('bg-gray-100', !isActive);
    btn.classList.toggle('text-gray-500', !isActive);
    btn.classList.toggle('hover:bg-indigo-100', !isActive);
    btn.classList.toggle('hover:text-indigo-600', !isActive);
  });
}

// =============================================
// ⚙️ 리스트 관리 모달
// =============================================

function openManageModal() {
  selectedIds.clear();
  manageFilter = 'all';
  updateManageTabs();
  renderManageList();
  document.getElementById('manage-modal').classList.remove('hidden');
}

function closeManageModal() {
  selectedIds.clear();
  document.getElementById('manage-modal').classList.add('hidden');
}

/**
 * getFilteredManageTodos(): 모달 탭 필터에 따라 표시할 todos 배열을 반환
 */
function getFilteredManageTodos() {
  if (manageFilter === 'active') {
    return todos.filter(function(todo) { return todo.completed === false; });
  }
  if (manageFilter === 'done') {
    return todos.filter(function(todo) { return todo.completed === true; });
  }
  return todos;
}

/**
 * createManageItem(todo): 리스트 관리 모달의 항목 <li>를 생성하고 이벤트를 연결하여 반환합니다.
 */
function createManageItem(todo) {
  const isSelected = selectedIds.has(todo.id);

  const li = document.createElement('li');
  li.className = 'flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 cursor-pointer select-none'
    + (isSelected ? ' ring-2 ring-indigo-400 bg-indigo-50' : '');

  const ddayInfo = todo.dueDate ? getDDayLabel(todo.dueDate) : null;
  const ddayBadgeHtml = ddayInfo
    ? `<span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${ddayInfo.style}">${ddayInfo.label}</span>`
    : '';

  li.innerHTML = `
    <span
      class="drag-handle text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing text-xl flex-shrink-0 select-none leading-none"
      title="드래그하여 순서 변경"
      aria-hidden="true"
    >⠿</span>
    <input
      type="checkbox"
      ${isSelected ? 'checked' : ''}
      class="w-5 h-5 rounded border-gray-300 accent-indigo-500 cursor-pointer flex-shrink-0"
      aria-label="선택"
    />
    <span class="flex-1 text-sm ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'}">
      ${todo.text}
    </span>
    ${ddayBadgeHtml}
    <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${todo.completed ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-500'}">
      ${todo.completed ? '완료' : '진행 중'}
    </span>
  `;

  const checkboxEl = li.querySelector('input[type="checkbox"]');

  // 체크박스 change → 선택 상태 토글
  checkboxEl.addEventListener('change', function() {
    if (checkboxEl.checked) {
      selectedIds.add(todo.id);
    } else {
      selectedIds.delete(todo.id);
    }
    renderManageList();
  });

  // li 클릭으로도 선택 토글
  li.addEventListener('click', function(e) {
    if (e.target === checkboxEl) return;
    if (selectedIds.has(todo.id)) {
      selectedIds.delete(todo.id);
    } else {
      selectedIds.add(todo.id);
    }
    renderManageList();
  });

  applyDragEvents(li, todo.id);
  return li;
}

/**
 * renderManageList(): 리스트 관리 모달의 항목 목록을 렌더링합니다.
 */
function renderManageList() {
  const manageListEl = document.getElementById('manage-list');
  manageListEl.innerHTML = '';

  const filteredTodos = getFilteredManageTodos();

  if (filteredTodos.length === 0) {
    manageListEl.innerHTML = '<li class="text-center py-8 text-gray-400 text-sm list-none">해당 항목이 없어요.</li>';
    return;
  }

  filteredTodos.forEach(function(todo) {
    manageListEl.appendChild(createManageItem(todo));
  });
}

function updateManageTabs() {
  document.querySelectorAll('.manage-tab-btn').forEach(function(btn) {
    const isActive = btn.dataset.tab === manageFilter;
    btn.classList.toggle('bg-indigo-500', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('font-semibold', isActive);
    btn.classList.toggle('bg-gray-100', !isActive);
    btn.classList.toggle('text-gray-500', !isActive);
    btn.classList.toggle('hover:bg-indigo-100', !isActive);
    btn.classList.toggle('hover:text-indigo-600', !isActive);
  });
}

// =============================================
// 🖱️ 드래그 앤 드롭: 항목 순서 재배치
// =============================================

/**
 * applyDragEvents(li, todoId): <li> 요소에 드래그 앤 드롭 이벤트를 연결합니다.
 */
function applyDragEvents(li, todoId) {
  li.setAttribute('draggable', 'true');
  li.style.cursor = 'grab';

  li.addEventListener('dragstart', function(e) {
    dragSrcId = todoId;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(function() { li.classList.add('opacity-40'); }, 0);
  });

  li.addEventListener('dragend', function() {
    li.classList.remove('opacity-40');
  });

  li.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragSrcId !== todoId) {
      li.classList.add('ring-2', 'ring-indigo-400');
    }
  });

  li.addEventListener('dragleave', function() {
    li.classList.remove('ring-2', 'ring-indigo-400');
  });

  li.addEventListener('drop', function(e) {
    e.preventDefault();
    li.classList.remove('ring-2', 'ring-indigo-400');

    if (dragSrcId === null || dragSrcId === todoId) return;

    const srcIndex = todos.findIndex(function(todo) { return todo.id === dragSrcId; });
    const destIndex = todos.findIndex(function(todo) { return todo.id === todoId; });

    if (srcIndex === -1 || destIndex === -1) return;

    // 두 항목의 위치 교환
    const draggedItem = todos[srcIndex];
    todos[srcIndex] = todos[destIndex];
    todos[destIndex] = draggedItem;

    saveTodos();
    dragSrcId = null;
    renderTodos();

    if (!document.getElementById('manage-modal').classList.contains('hidden')) {
      renderManageList();
    }
  });
}

// =============================================
// ✏️ 수정: 특정 할 일의 텍스트 및 날짜 업데이트
// =============================================

function updateTodo(todoId, newText, newDueDate) {
  const trimmedText = newText.trim();

  if (trimmedText === '') {
    alert('할 일 내용을 입력해 주세요!');
    return;
  }

  const targetTodo = todos.find(function(todo) { return todo.id === todoId; });
  if (targetTodo) {
    targetTodo.text = trimmedText;
    if (newDueDate !== undefined) {
      targetTodo.dueDate = newDueDate;
    }
    saveTodos();
  }

  renderTodos();
}

// =============================================
// 🗑️ 휴지통으로 이동: todos → trash
// =============================================

function moveToTrash(todoId) {
  const confirmed = confirm('휴지통으로 이동하시겠습니까?');
  if (!confirmed) return;

  const todoIndex = todos.findIndex(function(todo) { return todo.id === todoId; });
  if (todoIndex === -1) return;

  const removedTodo = todos.splice(todoIndex, 1)[0];
  removedTodo.deletedAt = Date.now();
  trash.push(removedTodo);

  saveTodos();
  saveTrash();
  renderTodos();
}

/**
 * moveSelectedToTrash(): 선택된 항목들을 휴지통으로 이동합니다.
 */
function moveSelectedToTrash() {
  if (selectedIds.size === 0) {
    alert('삭제할 항목을 선택해 주세요!');
    return;
  }
  if (!confirm(selectedIds.size + '개 항목을 휴지통으로 이동하시겠습니까?')) return;

  const deletedAt = Date.now();
  todos.forEach(function(todo) {
    if (selectedIds.has(todo.id)) {
      todo.deletedAt = deletedAt;
      trash.push(todo);
    }
  });
  todos = todos.filter(function(todo) { return !selectedIds.has(todo.id); });

  saveTodos();
  saveTrash();
  selectedIds.clear();
  renderTodos();
  renderManageList();
  if (todos.length === 0) closeManageModal();
}

/**
 * moveAllToTrash(): 모든 할 일을 휴지통으로 이동합니다.
 */
function moveAllToTrash() {
  if (!confirm('모든 할 일을 휴지통으로 이동하시겠습니까?')) return;

  const deletedAt = Date.now();
  todos.forEach(function(todo) {
    todo.deletedAt = deletedAt;
    trash.push(todo);
  });
  todos = [];

  saveTodos();
  saveTrash();
  selectedIds.clear();
  renderTodos();
  closeManageModal();
}

// =============================================
// ♻️ 복원: trash → todos
// =============================================

function restoreFromTrash(trashItemId) {
  const trashIndex = trash.findIndex(function(trashItem) { return trashItem.id === trashItemId; });
  if (trashIndex === -1) return;

  const restoredTodo = trash.splice(trashIndex, 1)[0];
  delete restoredTodo.deletedAt;
  todos.push(restoredTodo);

  saveTodos();
  saveTrash();
  renderTodos();
  renderTrashList();
}

// =============================================
// 💀 영구 삭제: trash에서 완전 제거
// =============================================

function permanentDelete(trashItemId) {
  if (!confirm('영구 삭제하시겠습니까? 복구할 수 없습니다.')) return;
  trash = trash.filter(function(trashItem) { return trashItem.id !== trashItemId; });
  saveTrash();
  renderTrashList();
}

// =============================================
// 🗑️ 휴지통 모달: 열기 / 닫기 / 렌더링
// =============================================

function openTrashModal() {
  renderTrashList();
  document.getElementById('trash-modal').classList.remove('hidden');
}

function closeTrashModal() {
  document.getElementById('trash-modal').classList.add('hidden');
}

/**
 * createTrashItem(trashItem): 휴지통 항목 <li>를 생성하고 이벤트를 연결하여 반환합니다.
 */
function createTrashItem(trashItem) {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const daysUntilDeletion = Math.ceil((THIRTY_DAYS_MS - (now - trashItem.deletedAt)) / (1000 * 60 * 60 * 24));
  const deletionLabel = daysUntilDeletion > 0 ? daysUntilDeletion + '일 후 삭제됨' : '곧 삭제됨';

  const li = document.createElement('li');
  li.className = 'flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3';

  li.innerHTML = `
    <span class="flex-1 text-sm text-gray-500 line-through truncate">${trashItem.text}</span>
    <span class="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-400 flex-shrink-0 whitespace-nowrap">${deletionLabel}</span>
    <button type="button" class="restore-btn flex-shrink-0 text-xs text-indigo-500 hover:text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors">복원</button>
    <button type="button" class="perm-del-btn flex-shrink-0 text-xs text-red-400 hover:text-red-600 border border-red-200 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">영구 삭제</button>
  `;

  li.querySelector('.restore-btn').addEventListener('click', function() {
    restoreFromTrash(trashItem.id);
  });

  li.querySelector('.perm-del-btn').addEventListener('click', function() {
    permanentDelete(trashItem.id);
  });

  return li;
}

/**
 * renderTrashList(): 휴지통 모달의 항목 목록을 렌더링합니다.
 */
function renderTrashList() {
  const trashListEl = document.getElementById('trash-list');
  trashListEl.innerHTML = '';

  if (trash.length === 0) {
    trashListEl.innerHTML = '<li class="text-center py-10 text-gray-400 text-sm list-none">휴지통이 비어 있어요. 🗑️</li>';
    return;
  }

  trash.forEach(function(trashItem) {
    trashListEl.appendChild(createTrashItem(trashItem));
  });
}

// =============================================
// ✅ 토글: 완료 상태 반전
// =============================================

function toggleTodo(todoId) {
  const targetTodo = todos.find(function(todo) { return todo.id === todoId; });

  if (targetTodo) {
    targetTodo.completed = !targetTodo.completed;
    saveTodos();
  }

  renderTodos();
}

// =============================================
// ➕ 추가: 새 할 일을 todos 배열에 추가
// =============================================

function addTodo() {
  const todoInputEl = document.getElementById('todo-input');
  const trimmedText = todoInputEl.value.trim();
  const useDateToggleEl = document.getElementById('use-date-toggle');
  const dueDateInputEl = document.getElementById('due-date-input');

  if (trimmedText === '') {
    alert('할 일을 입력해 주세요! ✏️');
    return;
  }

  const newTodo = {
    id: Date.now(),
    text: trimmedText,
    completed: false,
    dueDate: useDateToggleEl.checked && dueDateInputEl.value ? dueDateInputEl.value : null
  };
  todos.push(newTodo);
  saveTodos();

  // 입력창 및 날짜 설정 초기화
  todoInputEl.value = '';
  useDateToggleEl.checked = false;
  dueDateInputEl.value = '';
  document.getElementById('date-input-area').classList.add('hidden');

  renderTodos();
}

// =============================================
// 🎮 이벤트 연결
// =============================================

document.getElementById('add-btn').addEventListener('click', addTodo);

document.getElementById('todo-input').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') addTodo();
});

document.getElementById('use-date-toggle').addEventListener('change', function() {
  document.getElementById('date-input-area').classList.toggle('hidden', !this.checked);
});

document.querySelectorAll('.filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

document.getElementById('manage-btn').addEventListener('click', openManageModal);
document.getElementById('modal-close-btn').addEventListener('click', closeManageModal);

document.getElementById('manage-modal').addEventListener('click', function(e) {
  if (e.target === this) closeManageModal();
});

document.querySelectorAll('.manage-tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    manageFilter = btn.dataset.tab;
    updateManageTabs();
    renderManageList();
  });
});

document.getElementById('modal-delete-selected-btn').addEventListener('click', moveSelectedToTrash);
document.getElementById('modal-delete-all-btn').addEventListener('click', moveAllToTrash);

document.getElementById('open-trash-btn').addEventListener('click', openTrashModal);
document.getElementById('trash-close-btn').addEventListener('click', closeTrashModal);

document.getElementById('trash-modal').addEventListener('click', function(e) {
  if (e.target === this) closeTrashModal();
});

// Escape 키로 열린 모달 닫기 (휴지통 → 리스트 관리 순서로 우선 처리)
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;

  if (!document.getElementById('trash-modal').classList.contains('hidden')) {
    closeTrashModal();
    return;
  }

  if (!document.getElementById('manage-modal').classList.contains('hidden')) {
    closeManageModal();
  }
});
