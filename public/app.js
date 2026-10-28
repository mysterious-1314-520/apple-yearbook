const $ = (sel) => document.querySelector(sel);

let data = null;
let editingId = null;

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `请求失败 (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

/* ---------- 渲染 ---------- */
function renderCover(meta) {
  $('#coverSchool').textContent = meta.school;
  $('#coverClass').textContent = meta.className;
  $('#coverYear').textContent = meta.gradYear;
  $('#coverMotto').textContent = meta.motto;
  $('#prefaceText').textContent = meta.preface;
  $('#prefaceAuthor').textContent = '—— ' + meta.prefaceAuthor;
  $('#footerText').textContent = `© ${meta.gradYear} ${meta.school} ${meta.className} · 同学录`;
  document.title = `同学录 · ${meta.school} ${meta.className}`;
}

function renderCampus(campus, moments) {
  $('#campusGrid').innerHTML = campus.map((c) => `
    <article class="card reveal">
      <div class="photo" style="background:${c.gradient}">${c.icon}</div>
      <div class="card-body">
        <h4>${esc(c.title)}</h4>
        <p>${esc(c.desc)}</p>
      </div>
    </article>`).join('');

  $('#momentList').innerHTML = moments.map((m) => `
    <div class="timeline-item reveal">
      <div class="timeline-date">${esc(m.date)} · ${esc(m.tag)}</div>
      <h4>${esc(m.title)}</h4>
      <p>${esc(m.desc)}</p>
    </div>`).join('');
}

function renderTeachers(teachers, students) {
  $('#teacherGrid').innerHTML = teachers.map((t) => `
    <article class="card teacher-card reveal">
      <div class="avatar">${esc(t.initial)}</div>
      <div class="teacher-info">
        <h4>${esc(t.name)} 老师</h4>
        <div class="subject">${esc(t.subject)}</div>
        <p class="message">「${esc(t.message)}」</p>
      </div>
    </article>`).join('');

  $('#studentGrid').innerHTML = students.map((s) => `
    <article class="card student-card reveal" data-student="${s.id}">
      <div class="avatar" style="background:${s.avatarGradient}">${esc(s.initial)}</div>
      <h4>${esc(s.name)}</h4>
      <div class="meta">${esc(s.constellation)} · ${esc(s.specialty)}</div>
      <div class="hobby">兴趣：${esc(s.hobbies)}</div>
    </article>`).join('');
}

function renderProfiles(students) {
  $('#profileGrid').innerHTML = students.map((s) => `
    <article class="card profile-card reveal" data-student="${s.id}">
      <div class="profile-head">
        <div class="avatar" style="background:${s.avatarGradient}">${esc(s.initial)}</div>
        <div>
          <h4>${esc(s.name)}</h4>
          <div class="meta">${esc(s.constellation)}</div>
        </div>
      </div>
      <dl class="profile-rows">
        <div><dt>电话</dt><dd>${esc(s.phone)}</dd></div>
        <div><dt>邮箱</dt><dd>${esc(s.email)}</dd></div>
        <div><dt>未来规划</dt><dd>${esc(s.plan)}</dd></div>
      </dl>
      <p class="profile-quote">${esc(s.message)}</p>
    </article>`).join('');
}

function renderGallery(gallery) {
  $('#galleryGrid').innerHTML = gallery.map((g) => `
    <article class="card reveal">
      <div class="photo" style="background:${g.gradient};height:190px;font-size:44px;">📸</div>
      <div class="card-body">
        <span class="tag">${esc(g.type)}</span>
        <h4>${esc(g.title)}</h4>
        <p>${esc(g.desc)}</p>
      </div>
    </article>`).join('');
}

function renderMessages(messages) {
  $('#msgList').innerHTML = messages.map((m) => `
    <article class="msg-card">
      <div class="msg-top">
        <div class="msg-author">${esc(m.name)} <span>→ ${esc(m.to)}</span></div>
        <time class="msg-time">${formatTime(m.createdAt)}</time>
      </div>
      <p class="msg-content">${esc(m.content)}</p>
      <button class="msg-del" data-del="${m.id}">删除</button>
    </article>`).join('');
}

/* ---------- 学生档案弹窗 ---------- */
function openModal(id) {
  const s = data.students.find((x) => x.id === id);
  if (!s) return;
  editingId = id;
  $('#modalBody').innerHTML = `
    <div class="avatar" style="background:${s.avatarGradient}">${esc(s.initial)}</div>
    <h3>${esc(s.name)}</h3>
    <p class="modal-meta">${esc(s.constellation)} · ${esc(s.specialty)}</p>
    <dl class="profile-rows">
      <div><dt>电话</dt><dd>${esc(s.phone)}</dd></div>
      <div><dt>邮箱</dt><dd>${esc(s.email)}</dd></div>
      <div><dt>兴趣爱好</dt><dd>${esc(s.hobbies)}</dd></div>
      <div><dt>未来规划</dt><dd>${esc(s.plan)}</dd></div>
    </dl>
    <div class="modal-quote"><strong>毕业感言</strong>${esc(s.message)}</div>
    <div class="edit-box">
      <textarea id="editMessage" rows="3" placeholder="修改你的毕业感言…">${esc(s.message)}</textarea>
      <textarea id="editPlan" rows="2" placeholder="修改未来规划…">${esc(s.plan)}</textarea>
      <button class="btn-primary" id="saveProfile">保存修改</button>
    </div>`;
  $('#modalMask').hidden = false;
  document.body.style.overflow = 'hidden';

  $('#saveProfile').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = '保存中…';
    try {
      const updated = await api(`/api/students/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          message: $('#editMessage').value,
          plan: $('#editPlan').value
        })
      });
      Object.assign(data.students.find((x) => x.id === editingId), updated);
      renderProfiles(data.students);
      renderTeachers(data.teachers, data.students);
      bindStudentCards();
      closeModal();
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '保存修改';
    }
  });
}

function closeModal() {
  $('#modalMask').hidden = true;
  document.body.style.overflow = '';
  editingId = null;
}

function bindStudentCards() {
  document.querySelectorAll('[data-student]').forEach((el) => {
    el.addEventListener('click', () => openModal(el.dataset.student));
  });
}

/* ---------- 悬浮底栏滚动联动 ---------- */
function initDock() {
  const items = document.querySelectorAll('.dock-item');
  const map = new Map();
  items.forEach((it) => {
    const sec = document.getElementById(it.dataset.target);
    if (sec) map.set(sec, it);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        items.forEach((i) => i.classList.remove('active'));
        const active = map.get(entry.target);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px' });

  map.forEach((_, sec) => observer.observe(sec));
}

/* ---------- 滚动浮现 ---------- */
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

/* ---------- 留言 ---------- */
function initMessageForm() {
  $('#msgForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#msgSubmit');
    btn.disabled = true;
    btn.textContent = '提交中…';
    try {
      const message = await api('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          name: $('#msgName').value,
          to: $('#msgTo').value || '全班同学',
          content: $('#msgContent').value
        })
      });
      data.messages.unshift(message);
      renderMessages(data.messages);
      $('#msgContent').value = '';
      bindDelete();
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '签名留念';
    }
  });
}

function bindDelete() {
  document.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('确认删除这条留言？')) return;
      try {
        await api(`/api/messages/${btn.dataset.del}`, { method: 'DELETE' });
        data.messages = data.messages.filter((m) => m.id !== btn.dataset.del);
        renderMessages(data.messages);
        bindDelete();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

/* ---------- 工具 ---------- */
function esc(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ---------- 启动 ---------- */
async function init() {
  data = await api('/api/yearbook');
  renderCover(data.meta);
  renderCampus(data.campus, data.moments);
  renderTeachers(data.teachers, data.students);
  renderProfiles(data.students);
  renderGallery(data.gallery);
  renderMessages(data.messages);
  bindStudentCards();
  bindDelete();
  initMessageForm();
  initDock();
  initReveal();

  $('#modalClose').addEventListener('click', closeModal);
  $('#modalMask').addEventListener('click', (e) => {
    if (e.target === $('#modalMask')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

init().catch((err) => {
  document.getElementById('app').insertAdjacentHTML(
    'afterbegin',
    `<p style="text-align:center;padding:40px;color:#ff3b30;">数据加载失败：${esc(err.message)}</p>`
  );
});
