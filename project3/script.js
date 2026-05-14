// ── DOM 참조 ──────────────────────────────────────────────
const searchInput    = document.getElementById('search-input');
const searchBtn      = document.getElementById('search-btn');
const feedbackMsg    = document.getElementById('feedback-msg');
const loadingEl      = document.getElementById('loading');
const profileSection = document.getElementById('profile-section');
const contribSection = document.getElementById('contrib-section');
const reposSection   = document.getElementById('repos-section');

// 프로필 요소
const profileAvatar  = document.getElementById('profile-avatar');
const profileLink    = document.getElementById('profile-link');
const profileName    = document.getElementById('profile-name');
const profileLogin   = document.getElementById('profile-login');
const profileBio     = document.getElementById('profile-bio');
const statRepos      = document.getElementById('stat-repos');
const statGists      = document.getElementById('stat-gists');
const statFollowers  = document.getElementById('stat-followers');
const statFollowing  = document.getElementById('stat-following');

// 세부 정보 요소
const detailCompany  = document.getElementById('detail-company');
const companyText    = document.getElementById('company-text');
const detailBlog     = document.getElementById('detail-blog');
const blogLink       = document.getElementById('blog-link');
const detailLocation = document.getElementById('detail-location');
const locationText   = document.getElementById('location-text');
const joinedText     = document.getElementById('joined-text');

// 저장소 리스트
const reposList = document.getElementById('repos-list');

// Contribution Graph 요소
const contribChart = document.getElementById('contrib-chart');

// ── 스피너 제어 ───────────────────────────────────────────
function showSpinner() {
  loadingEl.classList.remove('hidden');
  searchBtn.disabled      = true;
  searchBtn.style.opacity = '0.6';
  searchBtn.style.cursor  = 'not-allowed';
}

function hideSpinner() {
  loadingEl.classList.add('hidden');
  searchBtn.disabled      = false;
  searchBtn.style.opacity = '1';
  searchBtn.style.cursor  = 'pointer';
}

// ── 피드백 메시지 ─────────────────────────────────────────
function showFeedback(msg, isError = false) {
  feedbackMsg.textContent = msg;
  feedbackMsg.style.color = isError ? '#e03131' : '#a4a097';
}

function clearFeedback() {
  feedbackMsg.textContent = '';
}

// ── 유틸 함수 ─────────────────────────────────────────────
function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function ensureHttps(url) {
  if (!url) return '#';
  return url.startsWith('http') ? url : 'https://' + url;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ── 섹션 페이드인 표시 ────────────────────────────────────
function showSection(el) {
  el.style.display = 'block';
  // 다음 프레임에서 fade-in 클래스 추가 (display 변경 후 애니메이션 트리거)
  requestAnimationFrame(() => {
    el.classList.remove('fade-in');
    void el.offsetWidth; // reflow 강제
    el.classList.add('fade-in');
  });
}

// ── 프로필 렌더링 ─────────────────────────────────────────
function renderProfile(user) {
  profileAvatar.src = user.avatar_url || '';
  profileAvatar.alt = `${user.login} avatar`;
  profileLink.href  = user.html_url  || '#';

  profileName.textContent  = user.name  || user.login;
  profileLogin.textContent = `@${user.login}`;
  profileBio.textContent   = user.bio   || '';

  statRepos.textContent     = (user.public_repos || 0).toLocaleString();
  statGists.textContent     = (user.public_gists || 0).toLocaleString();
  statFollowers.textContent = (user.followers    || 0).toLocaleString();
  statFollowing.textContent = (user.following    || 0).toLocaleString();

  // 회사
  if (user.company) {
    companyText.textContent = user.company.replace(/^@/, '');
    detailCompany.classList.remove('hidden');
  } else {
    detailCompany.classList.add('hidden');
  }

  // 블로그
  if (user.blog) {
    blogLink.href        = ensureHttps(user.blog);
    blogLink.textContent = user.blog;
    detailBlog.classList.remove('hidden');
  } else {
    detailBlog.classList.add('hidden');
  }

  // 위치
  if (user.location) {
    locationText.textContent = user.location;
    detailLocation.classList.remove('hidden');
  } else {
    detailLocation.classList.add('hidden');
  }

  // 가입일
  joinedText.textContent = `가입일: ${formatDate(user.created_at)}`;

  showSection(profileSection);
}

// ── Contribution Graph 렌더링 ─────────────────────────────
function renderContributionGraph(login) {
  // 이미지 초기화 (이전 사용자 잔디 숨김)
  contribChart.style.opacity = '0';
  contribSection.style.display = 'none';

  const chartUrl = `https://ghchart.rshah.org/40c463/${encodeURIComponent(login)}`;

  contribChart.onload = () => {
    showSection(contribSection);
    // 이미지 자체도 페이드인
    contribChart.style.opacity = '1';
  };

  contribChart.onerror = () => {
    // 이미지 로드 실패 시 섹션 숨김 유지 (조용히 처리)
    contribSection.style.display = 'none';
  };

  contribChart.src = chartUrl;
}

// ── 저장소 항목 렌더링 ────────────────────────────────────
function renderRepo(repo) {
  const li = document.createElement('li');
  li.className = 'repo-item py-4 px-2 transition-colors duration-150';

  li.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="min-w-0">
        <a href="${repo.html_url}" target="_blank" rel="noopener"
           class="repo-link font-semibold text-link-blue"
           style="font-size:15px; line-height:1.4;">
          ${escapeHtml(repo.name)}
        </a>
        ${repo.description
          ? `<p class="text-steel mt-1 truncate" style="font-size:13px; line-height:1.4; max-width:480px;">${escapeHtml(repo.description)}</p>`
          : ''}
      </div>
      <div class="flex flex-wrap gap-2 flex-shrink-0">
        <span class="badge-sm" style="background:#fef7d6; color:#523410;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ${repo.stargazers_count.toLocaleString()}
        </span>
        <span class="badge-sm" style="background:#dcecfa; color:#1a2a52;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          ${repo.watchers_count.toLocaleString()}
        </span>
        <span class="badge-sm" style="background:#d9f3e1; color:#1aae39;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>
          ${repo.forks_count.toLocaleString()}
        </span>
        ${repo.language
          ? `<span class="badge-sm" style="background:#e6e0f5; color:#391c57;">${escapeHtml(repo.language)}</span>`
          : ''}
      </div>
    </div>
  `;
  return li;
}

// ── 저장소 목록 렌더링 ────────────────────────────────────
function renderRepos(repos) {
  reposList.innerHTML = '';

  if (repos.length > 0) {
    repos.forEach(repo => reposList.appendChild(renderRepo(repo)));
  } else {
    // 빈 상태 안내 메시지
    reposList.innerHTML = `
      <li class="py-10 flex flex-col items-center gap-3 text-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c8c4be" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        <p class="font-semibold" style="font-size:15px; color:#37352f;">공개 저장소가 없습니다</p>
        <p style="font-size:13px; color:#a4a097; line-height:1.5;">이 사용자는 아직 공개된 저장소가 없어요.</p>
      </li>
    `;
  }

  showSection(reposSection);
}

// ── 메인 검색 함수 ────────────────────────────────────────
async function searchUser() {
  const username = searchInput.value.trim();

  if (!username) {
    showFeedback('사용자 이름을 입력해 주세요.', true);
    return;
  }

  clearFeedback();
  showSpinner();

  // 이전 결과 숨김
  profileSection.style.display = 'none';
  contribSection.style.display = 'none';
  reposSection.style.display   = 'none';
  profileSection.classList.remove('fade-in');
  contribSection.classList.remove('fade-in');
  reposSection.classList.remove('fade-in');

  try {
    // 1) 사용자 프로필 가져오기
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);

    if (userRes.status === 404) {
      showFeedback(`"${username}" 사용자를 찾을 수 없습니다.`, true);
      return;
    }
    if (userRes.status === 403) {
      showFeedback('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.', true);
      return;
    }
    if (!userRes.ok) {
      showFeedback(`오류가 발생했습니다. (HTTP ${userRes.status})`, true);
      return;
    }

    const user = await userRes.json();

    // 2) 저장소 목록 가져오기
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=5`
    );
    const repos = reposRes.ok ? await reposRes.json() : [];

    // 3) 렌더링
    renderProfile(user);
    renderContributionGraph(user.login);
    renderRepos(repos);

    showFeedback(`"${user.login}" 프로필을 불러왔습니다.`, false);

  } catch (err) {
    showFeedback('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.', true);
    console.error(err);
  } finally {
    hideSpinner();
  }
}

// ── 이벤트 리스너 ─────────────────────────────────────────
searchBtn.addEventListener('click', searchUser);

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchUser();
});

// 입력 중 에러 메시지 초기화
searchInput.addEventListener('input', () => {
  if (feedbackMsg.style.color === 'rgb(224, 49, 49)') {
    clearFeedback();
  }
});
