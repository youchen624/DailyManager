let mood = "";
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById('datePicker').value = today;
    loginProfile();
    readData()
});
document.querySelectorAll('#daily-mood button').forEach((button) => {
    button.addEventListener('click', function () {
        document.querySelectorAll('#daily-mood button').forEach(btn => btn.classList.remove('selected'));
        this.classList.add('selected');
        mood = this.dataset.mood;
        saveData();
    });
});
document.getElementById('dailyTitle').addEventListener('blur', saveData);
document.getElementById('dailyNote').addEventListener('blur', saveData);
document.getElementById('datePicker').addEventListener('change', readData);

async function loginProfile(goLogin) {
    const response = await fetch('/api/check-token', {
        method: 'GET',
        credentials: 'include'
    });
    const data = await response.json();
    // console.log(data.isLogin);
    if (data.isLogin) {
        toggle('login', 'isLogin', data.isLogin);
        toggle('account-profile', 'disable', goLogin ? undefined : true);
    } else if (goLogin) {
        window.location.href = `/login`;
    }
}

function saveData() {
    const date = new Date(document.getElementById('datePicker').value);
    const timestamp = date.getTime();
    const title = document.getElementById('dailyTitle').value;
    const note = document.getElementById('dailyNote').value;
    fetch(`/api/data/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ timestamp, data: { mood, title, note } })
    }).then(res => res.json()).then(data => {
        // alert(data.message);
    }).catch(err => console.error(err));
}
function readData() {
    const date = new Date(document.getElementById('datePicker').value);
    const timestamp = date.getTime();
    fetch(`/api/data/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ timestamp })
    }).then(res => res.json()).then(data => {
        if(data.mood) {
            document.querySelectorAll('#daily-mood button').forEach(btn => btn.classList.remove('selected'));
            document.querySelector(`[data-mood="${data.mood}"]`).classList.add('selected');
        } else {
            document.querySelectorAll('#daily-mood button').forEach(btn => btn.classList.remove('selected'));
        }
        document.getElementById('dailyTitle').value = data?.title ?? '';
        document.getElementById('dailyNote').value = data?.note ?? '';
        // alert(data.message);
    }).catch(err => console.error(err));
}

function toggle(ids, goal, state) {
    const idA = Array.isArray(ids) ? ids : [ids];
    idA.forEach((value) => {
        // console.log(`toggle ${value}'s '${goal}' to '${state}'`);
        const element = document.getElementById(value);
        element.classList.toggle(goal, state);
    });
}

async function login() {
    const account = document.getElementById('account').value;
    const password = document.getElementById('password').value;

    const response = await fetch(`/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, password }),
        credentials: 'include' // include Cookie
    });

    const data = await response.json();
    alert(data.message);
}

async function logout() {
    await fetch(`/api/logout`, {
        method: 'POST',
        credentials: 'include'
    });
    toggle('account-profile', 'disable', true);
    toggle('login', 'isLogin', false);
    alert("已登出");
}