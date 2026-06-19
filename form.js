// ====================== 你原本的业务代码（完全不动）======================
const API_URL = 'https://qfmyvgowvhzjpgormpyf.supabase.co/rest/v1/leads';
const SUPABASE_KEY = 'sb_publishable_YHwXVJZyaFYJfx2pW7WCEg_EX4WlVc5';
const TELEGRAM_GROUPS = [
    'https://t.me/+2NrdvbHHuMk2OWU1',
    'https://t.me/+GatBejDsIsphOWQ1',
    'https://t.me/+poeifPP9RkgzMDk0',
    'https://t.me/+js9lLPfAN5wzNmFl'
];
let targetTgLink = '';
let isSubmitting = false;

// 标准Supabase请求头，缺一不可
function getBaseHeaders() {
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
}

// 读取全部数据，无多余缓存参数，纯标准GET
async function findUserByPhone(inputPhone) {
    try {
        const res = await fetch(API_URL, {
            headers: getBaseHeaders(),
            cache: "no-cache"
        });
        const rawText = await res.text();
        console.log("接口原始返回：", res.status, rawText);
        if (!res.ok) throw new Error(`status:${res.status}`);
        const list = JSON.parse(rawText);
        // 精确匹配手机号字符串
        return list.find(row => String(row.phone) === String(inputPhone)) || null;
    } catch (err) {
        console.error("查询失败详情：", err);
        return null;
    }
}

function unlockBtn() {
    isSubmitting = false;
    document.getElementById('submitBtn').disabled = false;
}

// 查到旧数据弹窗（展示原有群组）
function showOldGroupModal(groupUrl) {
    targetTgLink = groupUrl;
    document.getElementById('modalTitle').innerText = "You Have Submitted Before";
    document.getElementById('modalDesc').innerText = "Your original group link has been loaded, click Join Now to enter.";
    document.getElementById('successModal').style.display = "flex";
}

// 查询失败兜底弹窗
function showRepeatTipModal() {
    targetTgLink = "";
    document.getElementById('modalTitle').innerText = "You Have Submitted Before";
    document.getElementById('modalDesc').innerText = "This phone number already exists, refresh page to load your group link.";
    document.getElementById('successModal').style.display = "flex";
}

// 新用户成功弹窗
function showNewSuccessModal() {
    document.getElementById('modalTitle').innerText = "✅ Submission Successful";
    document.getElementById('modalDesc').innerText = "Your registration completed, click Join Now to open your assigned Telegram group.";
    document.getElementById("successModal").style.display = "flex";
}

async function submitData() {
    if (isSubmitting) return;
    const submitBtn = document.getElementById("submitBtn");
    const name = document.getElementById("username").value.trim();
    const phone = document.getElementById("userphone").value.trim();
    const email = document.getElementById("useremail").value.trim();

    const phoneInput = document.getElementById("userphone");
    const phoneErr = document.getElementById("phoneError");
    const emailInput = document.getElementById("useremail");
    const emailErr = document.getElementById("emailError");

    phoneInput.classList.remove("error");
    phoneErr.innerText = "";
    emailInput.classList.remove("error");
    emailErr.innerText = "";

    // 表单校验
    if (!name || !phone || !email) {
        phoneErr.innerText = "Please fill in all fields";
        phoneInput.classList.add("error");
        return;
    }
    if (!/^\d{10}$/.test(phone)) {
        phoneInput.classList.add("error");
        phoneErr.innerText = "Please enter a valid 10-digit phone number";
        return;
    }
    if (!/^.+@.+\..+$/.test(email)) {
        emailInput.classList.add("error");
        emailErr.innerText = "Please enter a valid email address";
        return;
    }

    isSubmitting = true;
    submitBtn.disabled = true;

    // 前置查询匹配手机号
    const existUser = await findUserByPhone(phone);
    if (existUser) {
        showOldGroupModal(existUser.tg_group_url);
        unlockBtn();
        return;
    }

    // 新用户随机分配群组
    const randomIdx = Math.floor(Math.random() * TELEGRAM_GROUPS.length);
    targetTgLink = TELEGRAM_GROUPS[randomIdx];

    try {
        const postRes = await fetch(API_URL, {
            method: "POST",
            headers: getBaseHeaders(),
            body: JSON.stringify({
                name,
                phone,
                email,
                tg_group_url: targetTgLink
            })
        });

        // 捕获409手机号冲突
        if (postRes.status === 409) {
            const retryUser = await findUserByPhone(phone);
            if (retryUser) {
                showOldGroupModal(retryUser.tg_group_url);
            } else {
                showRepeatTipModal();
            }
            unlockBtn();
            return;
        }

        if (postRes.ok) {
            showNewSuccessModal();
        } else {
            phoneErr.innerText = "Submission failed, please try again later";
            phoneInput.classList.add("error");
        }
    } catch {
        phoneErr.innerText = "Network error, check your internet";
        phoneInput.classList.add("error");
    }

    unlockBtn();
}

// TG跳转按钮
document.getElementById("goToTgBtn").onclick = function () {
    if (targetTgLink) window.open(targetTgLink, "_blank");
};

// 滚动到表单
function scrollToForm() {
    document.getElementById("form").scrollIntoView({ behavior: "smooth" });
}

// ====================== 新增：苹果风卡片滚动滑入动效（不影响任何功能）======================
function initCardAnimation() {
    const cards = document.querySelectorAll('.card');
    function check() {
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100) {
                card.classList.add('show');
            }
        });
    }
    window.addEventListener('scroll', check);
    window.addEventListener('load', check);
}
initCardAnimation();
