// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7nq_DFrbGn2xXa5rdZS5PCLFo9MZshfE",
  authDomain: "to-do-ef6b1.firebaseapp.com",
  projectId: "to-do-ef6b1",
  storageBucket: "to-do-ef6b1.appspot.com",
  messagingSenderId: "496601988819",
  appId: "1:496601988819:web:f513accc13d85a4565de26",
  measurementId: "G-86BND58QD5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore();

let userId = null;

document.getElementById('login-button').addEventListener('click', googleLogin);
document.getElementById('logout-button').addEventListener('click', logout);

function googleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).then((result) => {
        userId = result.user.uid;
        document.getElementById('login-button').classList.add('hidden');
        document.getElementById('logout-button').classList.remove('hidden');
        loadTasks();
    }).catch((error) => {
        console.log(error);
    });
}

function logout() {
    signOut(auth).then(() => {
        userId = null;
        document.getElementById('login-button').classList.remove('hidden');
        document.getElementById('logout-button').classList.add('hidden');
        clearTasks();
    }).catch((error) => {
        console.log(error);
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        userId = user.uid;
        document.getElementById('login-button').classList.add('hidden');
        document.getElementById('logout-button').classList.remove('hidden');
        loadTasks();
    } else {
        userId = null;
        document.getElementById('login-button').classList.remove('hidden');
        document.getElementById('logout-button').classList.add('hidden');
        clearTasks();
    }
});

function saveTasks() {
    if (!userId) return;

    const tasks = {
        todo: [],
        onhold: [],
        done: []
    };

    document.querySelectorAll('#todo-column .todo-item').forEach(item => {
        tasks.todo.push({
            id: item.id,
            title: item.querySelector('.task-title').value
        });
    });

    document.querySelectorAll('#onhold-column .todo-item').forEach(item => {
        tasks.onhold.push({
            id: item.id,
            title: item.querySelector('.task-title').value
        });
    });

    document.querySelectorAll('#done-column .done-item').forEach(item => {
        tasks.done.push({
            id: item.id,
            title: item.querySelector('.task-title').value
        });
    });

    setDoc(doc(db, "users", userId), tasks).catch((error) => {
        console.log("Error saving tasks: ", error);
    });
}

function loadTasks() {
    if (!userId) return;

    getDoc(doc(db, "users", userId)).then((docSnap) => {
        if (docSnap.exists()) {
            const tasks = docSnap.data();
            clearTasks();

            tasks.todo.forEach(task => {
                createTaskElement(task, 'todo-column');
            });

            tasks.onhold.forEach(task => {
                createTaskElement(task, 'onhold-column');
            });

            tasks.done.forEach(task => {
                createTaskElement(task, 'done-column', true);
            });

            updateCounts();
        }
    }).catch((error) => {
        console.log("Error loading tasks: ", error);
    });
}

function clearTasks() {
    document.getElementById('todo-column').innerHTML = `
        <div class="todo-header">
            <h2>To-Do</h2>
            <button id="add-task-button">+</button>
        </div>`;
    document.getElementById('onhold-column').innerHTML = `<h2>On-Hold</h2>`;
    document.getElementById('done-column').innerHTML = `<h2>Done</h2>`;
    document.getElementById('add-task-button').addEventListener('click', addTask);
}

function createTaskElement(task, columnId, isDone = false) {
    const column = document.getElementById(columnId);
    const newTask = document.createElement('div');
    newTask.className = isDone ? 'todo-item done-item' : 'todo-item';
    newTask.draggable = true;
    newTask.id = task.id;

    const taskInput = document.createElement('input');
    taskInput.type = 'text';
    taskInput.value = task.title;
    taskInput.className = 'task-title';

    const timeButtons = document.createElement('div');
    timeButtons.className = 'time-buttons';

    [15, 30, 60].forEach(time => {
        const button = document.createElement('button');
        button.textContent = `${time}m`;
        button.onclick = () => startTimer(time, button);
        timeButtons.appendChild(button);
    });

    const doneButton = document.createElement('button');
    doneButton.textContent = '✓';
    doneButton.onclick = () => markAsDone(doneButton);

    const onHoldButton = document.createElement('button');
    onHoldButton.textContent = 'On-Hold';
    onHoldButton.onclick = () => markAsOnHold(onHoldButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'x';
    deleteButton.className = 'delete-button';
    deleteButton.onclick = () => deleteTask(deleteButton);

    newTask.appendChild(taskInput);
    newTask.appendChild(timeButtons);
    if (!isDone) newTask.appendChild(doneButton);
    newTask.appendChild(onHoldButton);
    newTask.appendChild(deleteButton);
    column.appendChild(newTask);

    addDragAndDrop(newTask);
}

function startTimer(minutes, button) {
    clearInterval(timer);

    if (currentTaskElement) {
        currentTaskElement.classList.remove('current-task');
    }

    currentTaskElement = button.parentElement.parentElement;
    currentTaskElement.classList.add('current-task');
    
    const taskTitleElement = currentTaskElement.querySelector('.task-title');
    const taskTitle = taskTitleElement.value;
    document.getElementById('header-title').textContent = `Working on: ${taskTitle}`;

    const endTime = Date.now() + minutes * 60000;
    timer = setInterval(() => {
        const remainingTime = endTime - Date.now();
        if (remainingTime <= 0) {
            clearInterval(timer);
            document.getElementById('timer').textContent = '00:00';
        } else {
            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            document.getElementById('timer').textContent = 
                String(minutes).padStart(2, '0') + ':' + 
                String(seconds).padStart(2, '0');
        }
    }, 1000);

    document.querySelectorAll('body *').forEach(element => {
        if (!element.closest('.current-task') && !element.closest('header') && !element.closest('#timer-container')) {
            element.classList.add('blurred');
        }
    });

    currentTaskElement.querySelectorAll('.task-title').forEach(element => {
        element.classList.remove('blurred');
    });
}

function stopTimer() {
    clearInterval(timer);
    document.getElementById('timer').textContent = '00:00';
    document.getElementById('header-title').textContent = 'To-Do List';

    document.querySelectorAll('.blurred').forEach(element => {
        element.classList.remove('blurred');
    });

    if (currentTaskElement) {
        currentTaskElement.classList.remove('current-task');
        currentTaskElement = null;
    }
}

function markAsDone(button) {
    stopTimer();
    const task = button.parentElement;
    task.classList.add('done-item');
    task.draggable = false;
    button.remove();
    document.getElementById('done-column').appendChild(task);
    updateCounts();
    saveTasks();
}

function markAsOnHold(button) {
    stopTimer();
    const task = button.parentElement;
    document.getElementById('onhold-column').appendChild(task);
    updateCounts();
    saveTasks();
}

function deleteTask(button) {
    const task = button.parentElement;
    task.remove();
    updateCounts();
    saveTasks();
}

function addTask() {
    const todoColumn = document.getElementById('todo-column');
    const newTask = document.createElement('div');
    newTask.className = 'todo-item';
    newTask.draggable = true;
    newTask.id = 'task-' + new Date().getTime();

    const taskInput = document.createElement('input');
    taskInput.type = 'text';
    taskInput.value = 'New Task';
    taskInput.className = 'task-title';

    const timeButtons = document.createElement('div');
    timeButtons.className = 'time-buttons';

    [15, 30, 60].forEach(time => {
        const button = document.createElement('button');
        button.textContent = `${time}m`;
        button.onclick = () => startTimer(time, button);
        timeButtons.appendChild(button);
    });

    const doneButton = document.createElement('button');
    doneButton.textContent = '✓';
    doneButton.onclick = () => markAsDone(doneButton);

    const onHoldButton = document.createElement('button');
    onHoldButton.textContent = 'On-Hold';
    onHoldButton.onclick = () => markAsOnHold(onHoldButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'x';
    deleteButton.className = 'delete-button';
    deleteButton.onclick = () => deleteTask(deleteButton);

    newTask.appendChild(taskInput);
    newTask.appendChild(timeButtons);
    newTask.appendChild(doneButton);
    newTask.appendChild(onHoldButton);
    newTask.appendChild(deleteButton);
    todoColumn.appendChild(newTask);

    addDragAndDrop(newTask);
    updateCounts();
    saveTasks();
}

function addDragAndDrop(task) {
    task.addEventListener('dragstart', dragStart);
    task.addEventListener('dragend', dragEnd);
}

document.querySelectorAll('.todo-item').forEach(item => {
    addDragAndDrop(item);
});

document.querySelectorAll('.column').forEach(column => {
    column.addEventListener('dragover', dragOver);
    column.addEventListener('dragenter', dragEnter);
    column.addEventListener('dragleave', dragLeave);
    column.addEventListener('drop', drop);
});

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
    setTimeout(() => {
        e.target.style.display = 'none';
    }, 0);
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('column')) {
        e.target.classList.add('drag-over');
    }
}

function dragLeave(e) {
    if (e.target.classList.contains('column')) {
        e.target.classList.remove('drag-over');
    }
}

function drop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const draggable = document.getElementById(id);
    if (e.target.classList.contains('column')) {
        e.target.appendChild(draggable);
    }
    e.target.classList.remove('drag-over');
    updateCounts();
    saveTasks();
}

function dragEnd(e) {
    e.target.style.display = 'flex';
    document.querySelectorAll('.drag-over').forEach(element => {
        element.classList.remove('drag-over');
    });
}

function updateCounts() {
    document.getElementById('tasks-count').textContent = document.getElementById('todo-column').querySelectorAll('.todo-item').length;
    document.getElementById('onhold-count').textContent = document.getElementById('onhold-column').querySelectorAll('.todo-item').length;
    document.getElementById('completed-count').textContent = document.getElementById('done-column').querySelectorAll('.done-item').length;
}

document.addEventListener('DOMContentLoaded', () => {
    showQuoteModal();
    updateCounts();
    document.getElementById('add-task-button').addEventListener('click', addTask);
});

function showQuoteModal() {
    const modal = document.getElementById('quote-modal');
    const quoteElement = document.getElementById('motivational-quote');
    quoteElement.textContent = getRandomQuote();
    modal.classList.add('show');
}

function closeQuoteModal() {
    const modal = document.getElementById('quote-modal');
    modal.classList.remove('show');
}
