import {
  supabase,
  fetchEvents,
  createEvent,
  removeEvent,
  fetchPhotos,
  uploadPhoto,
  removePhoto,
  subscribeToChanges
} from "./supabase.js";

const calendarEl = document.getElementById("calendar");
const monthTitleEl = document.getElementById("monthTitle");
const loveDaysEl = document.getElementById("loveDays");
const monthlyDateCountEl = document.getElementById("monthlyDateCount");
const monthlyPhotoCountEl = document.getElementById("monthlyPhotoCount");
const eventListEl = document.getElementById("eventList");
const photoListEl = document.getElementById("photoList");
const photoPreviewEl = document.getElementById("photoPreview");

const startDate = new Date(2026, 4, 18);
const now = new Date();

let currentYear = now.getFullYear();
let currentMonth = now.getMonth();
let events = [];
let photos = [];
let isLoading = false;
let selectedDateKey = toDateKey(new Date());

const holidays = {
  "2026-01-01": "신정", "2026-02-16": "설날 연휴", "2026-02-17": "설날", "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절", "2026-03-02": "대체공휴일", "2026-05-05": "어린이날", "2026-05-24": "부처님오신날",
  "2026-05-25": "대체공휴일", "2026-06-06": "현충일", "2026-08-15": "광복절", "2026-08-17": "대체공휴일",
  "2026-09-24": "추석 연휴", "2026-09-25": "추석", "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절", "2026-10-05": "대체공휴일", "2026-10-09": "한글날", "2026-12-25": "성탄절",
  "2027-01-01": "신정", "2027-02-06": "설날 연휴", "2027-02-07": "설날", "2027-02-08": "설날 연휴",
  "2027-03-01": "삼일절", "2027-05-05": "어린이날", "2027-05-13": "부처님오신날", "2027-06-06": "현충일",
  "2027-08-15": "광복절", "2027-09-14": "추석 연휴", "2027-09-15": "추석", "2027-09-16": "추석 연휴",
  "2027-10-03": "개천절", "2027-10-09": "한글날", "2027-12-25": "성탄절"
};

const solarTerms = [
  { month: 1, day: 5, name: "소한" }, { month: 1, day: 20, name: "대한" },
  { month: 2, day: 4, name: "입춘" }, { month: 2, day: 19, name: "우수" },
  { month: 3, day: 5, name: "경칩" }, { month: 3, day: 20, name: "춘분" },
  { month: 4, day: 4, name: "청명" }, { month: 4, day: 20, name: "곡우" },
  { month: 5, day: 5, name: "입하" }, { month: 5, day: 21, name: "소만" },
  { month: 6, day: 5, name: "망종" }, { month: 6, day: 21, name: "하지" },
  { month: 7, day: 7, name: "소서" }, { month: 7, day: 22, name: "대서" },
  { month: 8, day: 7, name: "입추" }, { month: 8, day: 23, name: "처서" },
  { month: 9, day: 7, name: "백로" }, { month: 9, day: 23, name: "추분" },
  { month: 10, day: 8, name: "한로" }, { month: 10, day: 23, name: "상강" },
  { month: 11, day: 7, name: "입동" }, { month: 11, day: 22, name: "소설" },
  { month: 12, day: 7, name: "대설" }, { month: 12, day: 21, name: "동지" }
];

const typeLabel = {
  boyfriend: "💙 남친",
  girlfriend: "💗 여친",
  date: "💛 데이트"
};

const typeEmoji = {
  boyfriend: "💙",
  girlfriend: "💗",
  date: "💛"
};

function pad(num) {
  return String(num).padStart(2, "0");
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateKeyFromParts(year, monthIndex, day) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

function selectDate(dateKey, shouldRender = true) {
  selectedDateKey = dateKey;
  document.getElementById("eventDate").value = dateKey;
  document.getElementById("photoDate").value = dateKey;
  if (shouldRender) renderCalendar();
}

function normalizeEvent(row) {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    title: row.title,
    memo: row.memo || "",
    created_at: row.created_at
  };
}

function normalizePhoto(row) {
  return {
    id: row.id,
    date: row.date,
    caption: row.caption || "",
    image_url: row.image_url,
    storage_path: "",
    created_at: row.created_at
  };
}

async function loadData() {
  try {
    isLoading = true;
    calendarEl.innerHTML = `<p class="empty">데이터를 불러오는 중입니다...</p>`;

    const [eventRows, photoRows] = await Promise.all([
      fetchEvents(),
      fetchPhotos()
    ]);

    events = eventRows.map(normalizeEvent);
    photos = photoRows.map(normalizePhoto);

    renderCalendar();
  } catch (error) {
    console.error(error);
    calendarEl.innerHTML = `<p class="empty">Supabase 데이터를 불러오지 못했습니다.<br>${error.message || error}</p>`;
  } finally {
    isLoading = false;
  }
}

function renderStats() {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.floor((todayOnly - startDate) / (1000 * 60 * 60 * 24)) + 1;
  loveDaysEl.textContent = diff > 0 ? `D+${diff}` : `D-${Math.abs(diff) + 1}`;

  const uniqueDateDates = new Set(
    events
      .filter(e => e.type === "date")
      .filter(e => {
        const d = new Date(e.date + "T00:00:00");
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .map(e => e.date)
  );

  monthlyDateCountEl.textContent = `${uniqueDateDates.size}일`;

  const monthPhotos = photos.filter(p => {
    const d = new Date(p.date + "T00:00:00");
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  monthlyPhotoCountEl.textContent = `${monthPhotos.length}장`;
}

function renderCalendar() {
  calendarEl.innerHTML = "";
  monthTitleEl.textContent = `${currentYear}년 ${currentMonth + 1}월`;

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "day";

    let dayNum;
    let cellYear = currentYear;
    let cellMonth = currentMonth;
    let muted = false;

    if (i < startWeekday) {
      dayNum = prevLastDay - startWeekday + i + 1;
      cellMonth = currentMonth - 1;
      if (cellMonth < 0) {
        cellMonth = 11;
        cellYear--;
      }
      muted = true;
    } else if (i >= startWeekday + daysInMonth) {
      dayNum = i - (startWeekday + daysInMonth) + 1;
      cellMonth = currentMonth + 1;
      if (cellMonth > 11) {
        cellMonth = 0;
        cellYear++;
      }
      muted = true;
    } else {
      dayNum = i - startWeekday + 1;
    }

    const key = dateKeyFromParts(cellYear, cellMonth, dayNum);
    if (muted) cell.classList.add("muted");
    if (key === toDateKey(new Date())) cell.classList.add("today");
    if (key === selectedDateKey) cell.classList.add("selected");

    cell.addEventListener("click", () => {
      selectDate(key);
      openDayDetail(key);
    });

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = dayNum;
    cell.appendChild(num);

    const dayPhotos = photos.filter(p => p.date === key);
    const hasPhotos = dayPhotos.length > 0;

    if (hasPhotos) {
      cell.classList.add("has-photo");
      cell.style.backgroundImage = `url("${dayPhotos[0].image_url}")`;

      const count = document.createElement("div");
      count.className = "photo-count";
      count.textContent = dayPhotos.length > 1 ? `📷 +${dayPhotos.length - 1}` : "📷";
      cell.appendChild(count);
    } else {
      if (holidays[key]) cell.appendChild(makeTag("holiday", `❤️ ${holidays[key]}`));

      solarTerms
        .filter(t => t.month === cellMonth + 1 && t.day === dayNum)
        .forEach(t => cell.appendChild(makeTag("term", `🌿 ${t.name}`)));

      events
        .filter(e => e.date === key)
        .forEach(e => cell.appendChild(makeTag(e.type, `${typeEmoji[e.type]} ${e.title}`)));
    }

    calendarEl.appendChild(cell);
  }

  renderEventList();
  renderPhotoList();
  renderStats();
}

function makeTag(className, text) {
  const tag = document.createElement("div");
  tag.className = `tag ${className}`;
  tag.textContent = text;
  tag.title = text;
  return tag;
}

async function addEvent() {
  const date = document.getElementById("eventDate").value;
  const type = document.getElementById("eventType").value;
  const title = document.getElementById("eventTitle").value.trim();
  const memo = document.getElementById("eventMemo").value.trim();

  if (!date) {
    alert("날짜를 선택해주세요.");
    return;
  }

  if (!title) {
    alert("일정 제목을 입력해주세요.");
    return;
  }

  try {
    await createEvent({ date, type, title, memo });

    const selected = new Date(date + "T00:00:00");
    currentYear = selected.getFullYear();
    currentMonth = selected.getMonth();

    document.getElementById("eventTitle").value = "";
    document.getElementById("eventMemo").value = "";

    await loadData();
  } catch (error) {
    console.error(error);
    alert(`일정 저장에 실패했습니다: ${error.message || error}`);
  }
}

async function deleteEvent(id) {
  if (!confirm("이 일정을 삭제할까요?")) return;

  try {
    await removeEvent(id);
    await loadData();
  } catch (error) {
    console.error(error);
    alert(`일정 삭제에 실패했습니다: ${error.message || error}`);
  }
}

function previewPhotos() {
  const files = Array.from(document.getElementById("photoFiles").files);
  photoPreviewEl.innerHTML = "";

  files.slice(0, 6).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement("img");
      img.src = e.target.result;
      photoPreviewEl.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

async function addPhotos() {
  const date = document.getElementById("photoDate").value;
  const files = Array.from(document.getElementById("photoFiles").files);
  const caption = document.getElementById("photoCaption").value.trim();

  if (!date) {
    alert("사진 날짜를 선택해주세요.");
    return;
  }

  if (files.length === 0) {
    alert("사진을 선택해주세요.");
    return;
  }

  try {
    const btn = document.getElementById("addPhotosBtn");
    btn.disabled = true;
    btn.textContent = "사진 업로드 중...";

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        await uploadPhoto({ file, date, caption });
      }
    }

    const selected = new Date(date + "T00:00:00");
    currentYear = selected.getFullYear();
    currentMonth = selected.getMonth();

    document.getElementById("photoFiles").value = "";
    document.getElementById("photoCaption").value = "";
    photoPreviewEl.innerHTML = "";

    await loadData();
  } catch (error) {
    console.error(error);
    alert(`사진 저장에 실패했습니다: ${error.message || error}`);
  } finally {
    const btn = document.getElementById("addPhotosBtn");
    btn.disabled = false;
    btn.textContent = "사진 저장하기";
  }
}

async function deletePhoto(id) {
  const photo = photos.find(p => p.id === id);
  if (!photo) return;
  if (!confirm("이 사진을 삭제할까요?")) return;

  try {
    await removePhoto(photo);
    await loadData();
  } catch (error) {
    console.error(error);
    alert(`사진 삭제에 실패했습니다: ${error.message || error}`);
  }
}

function renderEventList() {
  const monthEvents = events
    .filter(e => {
      const d = new Date(e.date + "T00:00:00");
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  if (monthEvents.length === 0) {
    eventListEl.innerHTML = `<p class="empty">이번 달 입력 일정이 아직 없습니다.</p>`;
    return;
  }

  eventListEl.innerHTML = monthEvents.map(e => `
    <div class="event-item">
      <strong>${escapeHtml(e.title)}</strong>
      <div class="event-meta">${e.date} · ${typeLabel[e.type]}</div>
      ${e.memo ? `<div class="event-meta">${escapeHtml(e.memo)}</div>` : ""}
      <button class="delete-btn" data-delete-event="${e.id}">삭제</button>
    </div>
  `).join("");

  eventListEl.querySelectorAll("[data-delete-event]").forEach(btn => {
    btn.addEventListener("click", () => deleteEvent(btn.dataset.deleteEvent));
  });
}

function renderPhotoList() {
  const monthPhotos = photos
    .filter(p => {
      const d = new Date(p.date + "T00:00:00");
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  if (monthPhotos.length === 0) {
    photoListEl.innerHTML = `<p class="empty">이번 달 사진이 아직 없습니다.<br>추억 사진을 올리면 달력 칸에 썸네일로 표시됩니다.</p>`;
    return;
  }

  photoListEl.innerHTML = monthPhotos.map(p => `
    <div class="photo-item">
      <strong>${p.date}</strong>
      <div class="event-meta">${escapeHtml(p.caption || "사진 메모 없음")}</div>
      <div class="memory-gallery">
        <img src="${p.image_url}" alt="추억 사진">
      </div>
      <button class="delete-btn" data-delete-photo="${p.id}">사진 삭제</button>
    </div>
  `).join("");

  photoListEl.querySelectorAll("[data-delete-photo]").forEach(btn => {
    btn.addEventListener("click", () => deletePhoto(btn.dataset.deletePhoto));
  });
}

function openDayDetail(dateKey) {
  const dayEvents = events.filter(e => e.date === dateKey);
  const dayPhotos = photos.filter(p => p.date === dateKey);
  const modal = document.getElementById("dayModal");
  const title = document.getElementById("modalTitle");
  const body = document.getElementById("modalBody");

  title.textContent = `${dateKey}의 기록`;

  const eventHtml = dayEvents.length
    ? dayEvents.map(e => `
      <div class="event-item">
        <strong>${typeEmoji[e.type]} ${escapeHtml(e.title)}</strong>
        <div class="event-meta">${typeLabel[e.type]}</div>
        ${e.memo ? `<div class="event-meta">${escapeHtml(e.memo)}</div>` : ""}
      </div>
    `).join("")
    : `<p class="empty">이날 입력된 일정이 없습니다.</p>`;

  const photoHtml = dayPhotos.length
    ? `<div class="modal-gallery">` + dayPhotos.map(p => `
      <div class="modal-photo">
        <img src="${p.image_url}" alt="추억 사진">
        <div>${escapeHtml(p.caption || "사진 메모 없음")}</div>
      </div>
    `).join("") + `</div>`
    : `<p class="empty">이날 등록된 사진이 없습니다.</p>`;

  body.innerHTML = `
    <h4>📌 일정</h4>
    ${eventHtml}
    <h4>📷 사진</h4>
    ${photoHtml}
  `;

  modal.classList.add("open");
}

function closeModal() {
  document.getElementById("dayModal").classList.remove("open");
}

function moveMonth(amount) {
  currentMonth += amount;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}

function goToday() {
  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  renderCalendar();
}

function setDefaultDate() {
  const today = toDateKey(new Date());
  selectedDateKey = today;
  document.getElementById("eventDate").value = today;
  document.getElementById("photoDate").value = today;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindEvents() {
  document.getElementById("prevMonthBtn").addEventListener("click", () => moveMonth(-1));
  document.getElementById("todayBtn").addEventListener("click", goToday);
  document.getElementById("nextMonthBtn").addEventListener("click", () => moveMonth(1));
  document.getElementById("addEventBtn").addEventListener("click", addEvent);
  document.getElementById("addPhotosBtn").addEventListener("click", addPhotos);
  document.getElementById("photoFiles").addEventListener("change", previewPhotos);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("dayModal").addEventListener("click", event => {
    if (event.target.id === "dayModal") closeModal();
  });
}

function bindRealtime() {
  subscribeToChanges(() => {
    if (!isLoading) loadData();
  });
}

bindEvents();
setDefaultDate();
loadData();
bindRealtime();
