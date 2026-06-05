// --- Mock Data Initialization ---
function initData() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    let items = JSON.parse(localStorage.getItem('items'));
    if (!items || items.length === 0 || !items[0].photo_url) {
        const dummyItems = [
            { id: 1, type: 'lost', status: 'active', name: '아이패드 프로 11인치', location: '중앙도서관 1층', date: '2026-06-01', details: '회색 케이스 씌워져 있습니다.', photo_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80', user_id: 'test_user', reporter_name: '테스트', reporter_student_id: '2026111111', created_at: Date.now() },
            { id: 2, type: 'found', status: 'active', name: '검은색 지갑', location: '신공학관 3층 라운지', date: '2026-06-03', details: '안에 학생증과 카드가 있습니다.', storage_location: '과사무실', photo_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80', user_id: 'test_user2', reporter_name: '홍길동', reporter_student_id: '2026222222', created_at: Date.now() - 100000 }
        ];
        localStorage.setItem('items', JSON.stringify(dummyItems));
    }
    if (!localStorage.getItem('inquiries')) {
        localStorage.setItem('inquiries', JSON.stringify([]));
    }
}

// --- Auth Utilities ---
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
}
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateAuthUI();
}
function logout() {
    localStorage.removeItem('currentUser');
    updateAuthUI();
    location.hash = '#home';
}

function updateAuthUI() {
    const user = getCurrentUser();
    const authLinks = document.getElementById('nav-auth-links');
    const userInfoDisplay = document.getElementById('user-info-display');
    const userNameSpan = document.getElementById('current-user-name');
    const logoutBtn = document.getElementById('nav-logout-btn');
    const loginBtn = document.getElementById('nav-login-btn');
    const footerAuth = document.getElementById('footer-auth-links');
    const reqEls = document.querySelectorAll('.auth-required');

    if (user) {
        authLinks.classList.remove('hidden');
        userInfoDisplay.classList.remove('hidden');
        userNameSpan.textContent = user.name;
        logoutBtn.classList.remove('hidden');
        loginBtn.classList.add('hidden');
        
        reqEls.forEach(el => el.classList.remove('hidden'));
        
        footerAuth.innerHTML = `<h4>회원정보</h4><ul><li><a href="#mypage">마이페이지</a></li><li><a href="#inquiries">문의 내역 확인</a></li><li><a href="#" onclick="logout(); return false;">로그아웃</a></li></ul>`;
    } else {
        authLinks.classList.add('hidden');
        userInfoDisplay.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        
        reqEls.forEach(el => el.classList.add('hidden'));
        
        footerAuth.innerHTML = `<h4>회원정보</h4><ul><li><a href="#auth">로그인 및 회원가입</a></li></ul>`;
    }
}

// --- Toast Alert ---
function showAlert(message, type = 'success') {
    const container = document.getElementById('alerts-container');
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.innerHTML = `<span>${message}</span>`;
    container.appendChild(div);
    
    setTimeout(() => {
        div.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        div.style.opacity = '0';
        div.style.transform = 'translateY(-20px)';
        setTimeout(() => div.remove(), 500);
    }, 3000);
}

// --- Routing & View Management ---
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}

function handleRoute() {
    const hash = location.hash || '#home';
    const [path, query] = hash.split('?');
    
    // Parse query params
    const params = {};
    if (query) {
        query.split('&').forEach(pair => {
            const [k, v] = pair.split('=');
            params[k] = decodeURIComponent(v);
        });
    }

    const user = getCurrentUser();

    switch(path) {
        case '#home':
            renderHome();
            showPage('page-home');
            break;
        case '#items':
            renderItems(params);
            showPage('page-items');
            break;
        case '#register':
            if (!user) { showAlert('로그인이 필요합니다.', 'warning'); location.hash='#auth'; return; }
            prepareRegisterForm(params.id);
            showPage('page-register');
            break;
        case '#detail':
            renderDetail(params.id);
            showPage('page-detail');
            break;
        case '#inquiries':
            if (!user) { showAlert('로그인이 필요합니다.', 'warning'); location.hash='#auth'; return; }
            renderInquiries();
            showPage('page-inquiries');
            break;
        case '#mypage':
            if (!user) { showAlert('로그인이 필요합니다.', 'warning'); location.hash='#auth'; return; }
            renderMypage();
            showPage('page-mypage');
            break;
        case '#auth':
            if (user) { location.hash='#home'; return; }
            showPage('page-auth');
            break;
        default:
            location.hash = '#home';
    }
}

// --- Rendering Logic ---
function renderHome() {
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const totalLost = items.filter(i => i.type === 'lost').length;
    const totalFound = items.filter(i => i.type === 'found').length;
    const active = items.filter(i => i.status === 'active').length;
    const resolved = items.filter(i => i.status === 'resolved').length;
    
    document.getElementById('home-stats').innerHTML = `
        <div class="stat-card"><div class="stat-num">${totalLost}</div><div class="stat-label">등록된 분실물</div></div>
        <div class="stat-card"><div class="stat-num">${totalFound}</div><div class="stat-label">등록된 습득물</div></div>
        <div class="stat-card"><div class="stat-num">${active}</div><div class="stat-label">해결 중인 물건</div></div>
        <div class="stat-card"><div class="stat-num">${resolved}</div><div class="stat-label">주인을 찾은 물건</div></div>
    `;

    const recent = items.filter(i => i.status === 'active').sort((a,b) => b.created_at - a.created_at).slice(0, 6);
    document.getElementById('recent-items-grid').innerHTML = generateItemsHTML(recent);
}

function renderItems(params) {
    let items = JSON.parse(localStorage.getItem('items') || '[]');
    items.sort((a,b) => b.created_at - a.created_at);

    if (params.type && params.type !== 'all') {
        items = items.filter(i => i.type === params.type);
        document.getElementById('filter-type').value = params.type;
    }
    if (params.status && params.status !== 'all') {
        items = items.filter(i => i.status === params.status);
        document.getElementById('filter-status').value = params.status;
    }

    const grid = document.getElementById('all-items-grid');
    grid.innerHTML = items.length ? generateItemsHTML(items) : `<div class="upload-container" style="cursor:default; padding: 60px 24px;">검색 결과가 없습니다.</div>`;

    // Setup live search
    const searchInput = document.getElementById('live-search-input');
    searchInput.oninput = (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = items.filter(i => i.name.toLowerCase().includes(query) || i.location.toLowerCase().includes(query) || i.details.toLowerCase().includes(query));
        grid.innerHTML = filtered.length ? generateItemsHTML(filtered) : `<div class="upload-container" style="cursor:default; padding: 60px 24px;">검색 결과가 없습니다.</div>`;
    };
    
    document.getElementById('filter-type').onchange = (e) => { params.type = e.target.value; updateItemsHash(params); };
    document.getElementById('filter-status').onchange = (e) => { params.status = e.target.value; updateItemsHash(params); };
}

function updateItemsHash(params) {
    const q = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
    location.hash = `#items${q ? '?'+q : ''}`;
}

function generateItemsHTML(items) {
    return items.map((item, idx) => `
        <div class="item-card animate-slide" style="animation-delay: ${idx * 0.05}s;">
            <div class="item-img-container">
                ${item.photo_url ? `<img src="${item.photo_url}" class="item-img" alt="${item.name}">` : `<div class="item-img-placeholder" style="background:#f1f3f5;"><span style="color:#adb5bd;">이미지 없음</span></div>`}
                <span class="item-badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}">${item.type === 'lost' ? '분실물' : '습득물'}</span>
                <span class="item-status-badge status-${item.status}">${item.status === 'active' ? (item.type === 'lost' ? '찾는 중' : '보관 중') : '해결 완료'}</span>
            </div>
            <div class="item-info">
                <h3 class="item-title">${item.name}</h3>
                <div class="item-meta">장소: <span class="item-location">${item.location}</span></div>
                <div class="item-meta">날짜: <span>${item.date}</span></div>
                <p class="item-details-preview">${item.details || '상세 특징이 없습니다.'}</p>
            </div>
            <div class="item-card-footer">
                <span class="item-reporter">제보자: <span>${item.reporter_name}</span></span>
                <a href="#detail?id=${item.id}" class="item-btn">상세 보기</a>
            </div>
        </div>
    `).join('');
}

function prepareRegisterForm(editId) {
    const form = document.getElementById('item-form');
    form.reset();
    document.getElementById('item-id').value = '';
    document.getElementById('reg-status-group').classList.add('hidden');
    document.getElementById('reg-page-title').innerText = '분실/습득물 등록';
    
    if (editId) {
        const items = JSON.parse(localStorage.getItem('items') || '[]');
        const item = items.find(i => i.id == editId);
        if (item) {
            document.getElementById('item-id').value = item.id;
            document.getElementById('reg-page-title').innerText = '정보 수정';
            document.querySelector(`input[name="item_type"][value="${item.type}"]`).checked = true;
            document.getElementById('reg-status-group').classList.remove('hidden');
            document.querySelector(`input[name="item_status"][value="${item.status}"]`).checked = true;
            document.getElementById('item-name').value = item.name;
            document.getElementById('item-location').value = item.location;
            document.getElementById('item-date').value = item.date;
            document.getElementById('item-details').value = item.details || '';
            if (item.type === 'found') {
                document.getElementById('storage-location-group').style.display = 'block';
                document.getElementById('storage-location').value = item.storage_location || '';
            }
        }
    }
}

function renderDetail(id) {
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const item = items.find(i => i.id == id);
    if (!item) { showAlert('게시글을 찾을 수 없습니다.', 'danger'); location.hash = '#items'; return; }
    
    const user = getCurrentUser();
    const isOwner = user && user.student_id === item.user_id;

    let actionsHTML = '';
    if (!user) {
        actionsHTML = `<a href="#auth" class="btn btn-primary" style="flex:1;">로그인하여 문의하기</a>`;
    } else if (isOwner) {
        actionsHTML = `
            <a href="#register?id=${item.id}" class="btn btn-secondary" style="flex:1;">수정하기</a>
            <button onclick="deleteItem(${item.id})" class="btn btn-danger" style="flex:1;">삭제하기</button>
        `;
    } else {
        actionsHTML = `<button onclick="document.getElementById('inquiry-box').classList.toggle('hidden')" class="btn btn-primary" style="flex:1;">문의하기</button>`;
    }

    const inquiries = JSON.parse(localStorage.getItem('inquiries') || '[]').filter(iq => iq.item_id == item.id);
    let inquiriesHTML = '';
    
    if (user && isOwner) {
        inquiriesHTML = `
            <div class="inquiry-section" style="margin-top:20px;">
                <h2 class="inquiry-title">받은 문의</h2>
                ${inquiries.length ? inquiries.map(iq => `
                    <div class="item-card" style="padding:15px; margin-bottom:10px;">
                        <h4>${iq.title}</h4><p>${iq.content}</p>
                        <small>작성자: ${iq.user_name}</small>
                    </div>
                `).join('') : '<p>아직 문의가 없습니다.</p>'}
            </div>
        `;
    } else if (user) {
        inquiriesHTML = `
            <div id="inquiry-box" class="inquiry-section hidden" style="margin-top:20px;">
                <h2 class="inquiry-title">문의 남기기</h2>
                <div class="form-group">
                    <input type="text" id="new-iq-title" class="form-control" placeholder="제목">
                </div>
                <div class="form-group">
                    <textarea id="new-iq-content" class="form-control" placeholder="내용" rows="3"></textarea>
                </div>
                <button onclick="submitInquiry(${item.id})" class="btn btn-primary">등록</button>
            </div>
            ${inquiries.filter(iq => iq.user_id === user.student_id).map(iq => `
                <div class="item-card" style="padding:15px; margin-top:10px;">
                    <h4>내 문의: ${iq.title}</h4><p>${iq.content}</p>
                </div>
            `).join('')}
        `;
    }

    document.getElementById('detail-content-area').innerHTML = `
        <a href="#items" style="display:inline-flex; gap:8px; margin-bottom:20px;">← 목록으로 돌아가기</a>
        <div class="detail-layout">
            <div class="detail-info-box" style="width:100%;">
                <span class="detail-type-badge ${item.type==='lost'?'badge-lost':'badge-found'}">${item.type==='lost'?'분실물':'습득물'}</span>
                <span class="item-status-badge status-${item.status}">${item.status==='active'?'진행 중':'해결 완료'}</span>
                <h1 class="detail-title" style="margin-top:10px;">${item.name}</h1>
                <div class="detail-meta-table">
                    <div class="detail-meta-row"><div class="detail-meta-label">장소</div><div class="detail-meta-val">${item.location}</div></div>
                    <div class="detail-meta-row"><div class="detail-meta-label">날짜</div><div class="detail-meta-val">${item.date}</div></div>
                    ${item.type==='found' ? `<div class="detail-meta-row"><div class="detail-meta-label">보관 장소</div><div class="detail-meta-val">${item.storage_location||'-'}</div></div>` : ''}
                    <div class="detail-meta-row"><div class="detail-meta-label">특징</div><div class="detail-meta-val">${item.details||'-'}</div></div>
                    <div class="detail-meta-row"><div class="detail-meta-label">제보자</div><div class="detail-meta-val">${item.reporter_name}</div></div>
                </div>
                <div class="detail-actions">${actionsHTML}</div>
            </div>
        </div>
        ${inquiriesHTML}
    `;
}

// --- Action Logic ---
function deleteItem(id) {
    if(!confirm('정말 삭제하시겠습니까?')) return;
    let items = JSON.parse(localStorage.getItem('items') || '[]');
    items = items.filter(i => i.id != id);
    localStorage.setItem('items', JSON.stringify(items));
    showAlert('삭제되었습니다.');
    location.hash = '#items';
}

function submitInquiry(itemId) {
    const title = document.getElementById('new-iq-title').value;
    const content = document.getElementById('new-iq-content').value;
    if(!title || !content) { showAlert('모두 입력해주세요', 'warning'); return; }
    
    const iqList = JSON.parse(localStorage.getItem('inquiries') || '[]');
    const user = getCurrentUser();
    iqList.push({ id: Date.now(), item_id: itemId, user_id: user.student_id, user_name: user.name, title, content, created_at: new Date().toLocaleString() });
    localStorage.setItem('inquiries', JSON.stringify(iqList));
    showAlert('문의가 등록되었습니다.');
    renderDetail(itemId);
}

function renderInquiries() {
    const user = getCurrentUser();
    const iqList = JSON.parse(localStorage.getItem('inquiries') || '[]');
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    
    const myInquiries = iqList.filter(iq => iq.user_id === user.student_id);
    const area = document.getElementById('inquiries-list-area');
    
    if (myInquiries.length === 0) {
        area.innerHTML = `<div style="text-align:center; padding: 40px; color: #666;">남긴 문의가 없습니다.</div>`;
        return;
    }

    area.innerHTML = myInquiries.map(iq => {
        const item = items.find(i => i.id == iq.item_id);
        return `
            <div class="item-card" style="padding: 20px; margin-bottom: 15px;">
                <h3 style="font-size: 16px; margin-bottom: 8px;">문의: ${iq.title}</h3>
                <p style="color: #444; font-size: 14px; margin-bottom: 10px;">${iq.content}</p>
                <div style="font-size: 12px; color: #888;">대상 게시글: <a href="#detail?id=${iq.item_id}">${item ? item.name : '삭제된 게시글'}</a></div>
            </div>
        `;
    }).join('');
}

function renderMypage() {
    const user = getCurrentUser();
    document.getElementById('prof-name').value = user.name;
    document.getElementById('prof-email').value = user.email;
    document.getElementById('prof-password').value = '';

    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const myItems = items.filter(i => i.user_id === user.student_id);
    const grid = document.getElementById('my-items-list');
    
    grid.innerHTML = myItems.length ? generateItemsHTML(myItems) : `<div style="padding: 20px;">등록한 글이 없습니다.</div>`;
}

// --- Event Listeners Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initData();
    updateAuthUI();

    // Type change in register form
    document.querySelectorAll('input[name="item_type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('storage-location-group').style.display = e.target.value === 'found' ? 'block' : 'none';
        });
    });

    // Auth Tabs
    document.getElementById('tab-login').onclick = () => {
        document.getElementById('login-form').classList.add('active');
        document.getElementById('register-form').classList.remove('active');
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('tab-register').classList.remove('active');
    };
    document.getElementById('tab-register').onclick = () => {
        document.getElementById('register-form').classList.add('active');
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('tab-register').classList.add('active');
        document.getElementById('tab-login').classList.remove('active');
    };

    // Logout
    document.getElementById('nav-logout-btn').onclick = logout;

    // Login Form
    document.getElementById('login-form').onsubmit = (e) => {
        e.preventDefault();
        const sid = document.getElementById('login-student-id').value;
        const pw = document.getElementById('login-password').value;
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.student_id === sid && u.password === pw);
        if (user) {
            setCurrentUser(user);
            showAlert('로그인 되었습니다.');
            location.hash = '#home';
        } else {
            showAlert('학번 또는 비밀번호가 일치하지 않습니다.', 'danger');
        }
    };

    // Register Form
    document.getElementById('register-form').onsubmit = (e) => {
        e.preventDefault();
        const sid = document.getElementById('reg-student-id').value;
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const pw = document.getElementById('reg-password').value;
        
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.student_id === sid)) {
            showAlert('이미 가입된 학번입니다.', 'danger'); return;
        }
        users.push({ student_id: sid, name, email, password: pw });
        localStorage.setItem('users', JSON.stringify(users));
        showAlert('회원가입이 완료되었습니다. 로그인 해주세요.');
        document.getElementById('tab-login').click();
    };

    // Item Registration
    document.getElementById('item-form').onsubmit = (e) => {
        e.preventDefault();
        const user = getCurrentUser();
        let items = JSON.parse(localStorage.getItem('items') || '[]');
        const idVal = document.getElementById('item-id').value;
        const isEdit = !!idVal;
        
        // Get the base64 image from preview if available
        let photo_url = '';
        const previewImg = document.getElementById('upload-preview');
        if (previewImg && previewImg.style.display !== 'none' && previewImg.src && !previewImg.src.includes('empty')) {
            photo_url = previewImg.src;
        } else if (isEdit) {
            // Keep old photo if editing and no new photo
            const oldItem = items.find(i => i.id == idVal);
            if (oldItem) photo_url = oldItem.photo_url || '';
        }

        const newItem = {
            id: isEdit ? parseInt(idVal) : Date.now(),
            type: document.querySelector('input[name="item_type"]:checked').value,
            status: isEdit ? document.querySelector('input[name="item_status"]:checked').value : 'active',
            name: document.getElementById('item-name').value,
            location: document.getElementById('item-location').value,
            date: document.getElementById('item-date').value,
            storage_location: document.getElementById('storage-location').value,
            details: document.getElementById('item-details').value,
            photo_url: photo_url,
            user_id: user.student_id,
            reporter_name: user.name,
            reporter_student_id: user.student_id,
            created_at: isEdit ? items.find(i=>i.id==idVal).created_at : Date.now()
        };

        if (isEdit) {
            items = items.map(i => i.id == newItem.id ? newItem : i);
            showAlert('수정되었습니다.');
        } else {
            items.push(newItem);
            showAlert('등록되었습니다.');
        }
        
        localStorage.setItem('items', JSON.stringify(items));
        location.hash = '#items';
    };

    // Profile Update
    document.getElementById('profile-update-form').onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('prof-name').value;
        const email = document.getElementById('prof-email').value;
        const pw = document.getElementById('prof-password').value;
        
        let user = getCurrentUser();
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        
        const idx = users.findIndex(u => u.student_id === user.student_id);
        if (idx !== -1) {
            users[idx].name = name;
            users[idx].email = email;
            if (pw) users[idx].password = pw;
            
            localStorage.setItem('users', JSON.stringify(users));
            setCurrentUser(users[idx]);
            showAlert('프로필이 업데이트 되었습니다.');
            renderMypage();
        }
    };

    // Mobile menu toggle
    document.getElementById('menu-toggle').onclick = () => {
        document.getElementById('nav-links').classList.toggle('mobile-active');
    };

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
});
