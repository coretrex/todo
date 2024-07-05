// script.js

let timer;
let currentTaskElement;
let timerPaused = false;
let remainingTime = 0;
let endTime;

// Initialize Firestore
const db = firebase.firestore();

// Event listeners for login modal
document.getElementById('login-button').addEventListener('click', () => {
    document.getElementById('login-modal').style.display = 'block';
});

document.getElementById('login-close').addEventListener('click', () => {
    document.getElementById('login-modal').style.display = 'none';
});

document.getElementById('show-register').addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
});

// Event listeners for login and registration
document.getElementById('login-submit').addEventListener('click', signIn);
document.getElementById('register-submit').addEventListener('click', signUp);
document.getElementById('user-icon').addEventListener('click', toggleUserMenu);
document.getElementById('logout-button').addEventListener('click', logOut);

// Function for user registration
function signUp() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    if (email && password) {
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                alert('User registered successfully!');
                document.getElementById('register-form').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
            })
            .catch(error => {
                alert(error.message);
            });
    } else {
        alert('Please enter both email and password.');
    }
}

// Function for user login
function signIn() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            alert('Sign in successful!');
            document.getElementById('login-modal').style.display = 'none';
            updateUserIcon(email);
            loadTasks(userCredential.user.uid);
        })
        .catch(error => {
            alert(error.message);
        });
}

// Function to update user icon after login
function updateUserIcon(email) {
    const loginButton = document.getElementById('login-button');
    const userMenu = document.getElementById('user-menu');
    const userIcon = document.getElementById('user-icon');
    loginButton.style.display = 'none';
    userIcon.textContent = email.charAt(0).toUpperCase();
    userMenu.style.display = 'flex';
}

// Function to toggle user menu
function toggleUserMenu() {
    const logoutButton = document.getElementById('logout-button');
    logoutButton.style.display = logoutButton.style.display === 'block' ? 'none' : 'block';
}

// Function for user logout
function logOut() {
    firebase.auth().signOut().then(() => {
        document.getElementById('user-menu').style.display = 'none';
        document.getElementById('login-button').style.display = 'block';
        alert('You have been logged out.');
        clearTasks();
    }).catch(error => {
        alert(error.message);
    });
}

// Function to clear tasks from the UI
function clearTasks() {
    document.getElementById('todo-column').innerHTML = '';
    document.getElementById('onhold-column').innerHTML = '';
    document.getElementById('done-column').innerHTML = '';
}

// Function to save tasks to Firestore
function saveTasks(userId) {
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

    db.collection('tasks').doc(userId).set(tasks)
        .then(() => {
            console.log('Tasks successfully saved!');
        })
        .catch(error => {
            console.error('Error saving tasks: ', error);
        });
}

// Function to load tasks from Firestore
function loadTasks(userId) {
    db.collection('tasks').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                const tasks = doc.data();
                console.log('Loaded tasks:', tasks);

                tasks.todo.forEach(task => {
                    createTaskElement(task, 'todo-column');
                });

                tasks.onhold.forEach(task => {
                    createTaskElement(task, 'onhold-column');
                });

                tasks.done.forEach(task => {
                    createTaskElement(task, 'done-column', true);
                });
            } else {
                console.log("No tasks found!");
            }
        })
        .catch(error => {
            console.error('Error loading tasks:', error);
        });
}

// Function to create task elements in the UI
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
    taskInput.addEventListener('input', () => saveTasks(firebase.auth().currentUser.uid));

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
    doneButton.className = 'done-button'; // Add a class for styling
    doneButton.onclick = () => markAsDone(doneButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'x';
    deleteButton.className = 'delete-button';
    deleteButton.onclick = () => deleteTask(deleteButton);

    const onHoldButton = document.createElement('button');
    onHoldButton.textContent = 'On-Hold';
    onHoldButton.className = 'onhold-button'; // Add a class for styling
    onHoldButton.onclick = () => markAsOnHold(onHoldButton);

    // Append buttons in the desired order
    newTask.appendChild(taskInput);
    newTask.appendChild(timeButtons);
    newTask.appendChild(onHoldButton);
    newTask.appendChild(deleteButton);
    newTask.appendChild(doneButton);

    column.appendChild(newTask);

    addDragAndDrop(newTask);
}

// Event listeners for adding tasks and stopping the timer
document.getElementById('add-task-button').addEventListener('click', addTask);
document.getElementById('stop-timer-button').addEventListener('click', stopTimer);
document.getElementById('quote-button').addEventListener('click', closeQuoteModal);
document.getElementById('pause-timer-button').addEventListener('click', pauseTimer);
document.getElementById('start-timer-button').addEventListener('click', () => startTimer(null, null, true));

// Function to get a random motivational quote
function getRandomQuote() {
    const quotes = [
        "When you think you're done, you're only at 40% of your body's capability. - David Goggins",
        "Pain unlocks a secret doorway in the mind, one that leads to both peak performance and beautiful silence. - David Goggins",
        "Be more than motivated, be more than driven, become literally obsessed to the point where people think you’re insane. - David Goggins",
        "Greatness pulls mediocrity into the mud. Get out there and get after it. - David Goggins",
        "We don't rise to the level of our expectations, we fall to the level of our training. - David Goggins",
        "You are in danger of living a life so comfortable and soft, that you will die without ever realizing your true potential. - David Goggins",
        "Don’t stop when you’re tired. Stop when you’re done. - David Goggins",
        "Every day you have to do this. You have to do this. Because why not? - David Goggins",
        "Callus your mind through pain and suffering. - David Goggins",
        "You will never learn from people if you always tap dance around the truth. - David Goggins",
        "It's okay, you’re not going to die. At the end of pain is success. - David Goggins",
        "Suffering is a test. That's all it is. Suffering is the true test of life. - David Goggins",
        "No matter what avenue I chose, I wanted to be the very best at that avenue. - David Goggins",
        "You have to master your mind to master the pain and suffering. - David Goggins",
        "The only way to reach the other side of this journey is to suffer. - David Goggins",
        "This is not about getting better than someone else, this is about being the best you. - David Goggins",
        "You have to be willing to suffer to get to the other side of greatness. - David Goggins",
        "The only way to achieve the impossible is to believe it is possible. - Charles Kingsleigh",
        "Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill",
        "Hardships often prepare ordinary people for an extraordinary destiny. - C.S. Lewis",
        "It does not matter how slowly you go as long as you do not stop. - Confucius",
        "The harder the conflict, the greater the triumph. - George Washington",
        "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
        "It is hard to fail, but it is worse never to have tried to succeed. - Theodore Roosevelt",
        "Do not pray for easy lives. Pray to be stronger men. - John F. Kennedy",
        "The way to get started is to quit talking and begin doing. - Walt Disney",
        "The only limit to our realization of tomorrow is our doubts of today. - Franklin D. Roosevelt",
        "What lies behind us and what lies before us are tiny matters compared to what lies within us. - Ralph Emerson",
    ];
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
}


// Modify the startTimer function to handle both initial start and resume
function startTimer(minutes, button, resume = false) {
    clearInterval(timer);

    if (currentTaskElement) {
        currentTaskElement.classList.remove('current-task');
    }

    if (!resume) {
        currentTaskElement = button.parentElement.parentElement;
        endTime = Date.now() + minutes * 60000;
    } else {
        endTime = Date.now() + remainingTime;
    }

    currentTaskElement.classList.add('current-task');
    const taskTitleElement = currentTaskElement.querySelector('.task-title');
    const taskTitle = taskTitleElement.value;
    document.getElementById('header-title').textContent = `Working on: ${taskTitle}`;

    timer = setInterval(() => {
        remainingTime = endTime - Date.now();
        if (remainingTime <= 0) {
            clearInterval(timer);
            document.getElementById('timer').textContent = '00:00';
            stopTimer();
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

    document.getElementById('pause-timer-button').style.display = 'inline-block';
    document.getElementById('stop-timer-button').style.display = 'inline-block';
    document.getElementById('start-timer-button').style.display = 'none';
}

function stopTimer() {
    clearInterval(timer);
    timerPaused = false;
    document.getElementById('timer').textContent = '00:00';
    document.getElementById('header-title').textContent = 'Task List';

    document.querySelectorAll('.blurred').forEach(element => {
        element.classList.remove('blurred');
    });

    if (currentTaskElement) {
        currentTaskElement.classList.remove('current-task');
        currentTaskElement = null;
    }

    document.getElementById('pause-timer-button').style.display = 'none';
    document.getElementById('start-timer-button').style.display = 'none';
    document.getElementById('stop-timer-button').style.display = 'none';
}


function pauseTimer() {
    clearInterval(timer);
    timerPaused = true;
    document.querySelectorAll('.blurred').forEach(element => {
        element.classList.remove('blurred');
    });

    document.getElementById('pause-timer-button').style.display = 'none';
    document.getElementById('start-timer-button').style.display = 'inline-block';
}

function stopTimer() {
    clearInterval(timer);
    timerPaused = false;
    document.getElementById('timer').textContent = '00:00';
    document.getElementById('header-title').textContent = 'Task List'; // Ensure this sets the header to "Task List"

    document.querySelectorAll('.blurred').forEach(element => {
        element.classList.remove('blurred');
    });

    if (currentTaskElement) {
        currentTaskElement.classList.remove('current-task');
        currentTaskElement = null;
    }

    document.getElementById('pause-timer-button').style.display = 'none';
    document.getElementById('start-timer-button').style.display = 'none';
    document.getElementById('stop-timer-button').style.display = 'none';
}


// Function to mark a task as done
function markAsDone(button) {
    stopTimer();
    const task = button.parentElement;
    task.classList.add('done-item');
    task.draggable = false;
    button.remove();
    document.getElementById('done-column').appendChild(task);
    updateCounts();
    saveTasks(firebase.auth().currentUser.uid);
    
    // Trigger confetti effect
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}


// Function to mark a task as on-hold
function markAsOnHold(button) {
    stopTimer();
    const task = button.parentElement;
    document.getElementById('onhold-column').appendChild(task);
    updateCounts();
    saveTasks(firebase.auth().currentUser.uid);
}

// Function to delete a task
function deleteTask(button) {
    const task = button.parentElement;
    task.remove();
    updateCounts();
    saveTasks(firebase.auth().currentUser.uid);
}

// Function to add a new task
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
    taskInput.addEventListener('input', () => saveTasks(firebase.auth().currentUser.uid));

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
    doneButton.className = 'done-button'; // Add a class for styling
    doneButton.onclick = () => markAsDone(doneButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'x';
    deleteButton.className = 'delete-button';
    deleteButton.onclick = () => deleteTask(deleteButton);

    const onHoldButton = document.createElement('button');
    onHoldButton.textContent = 'On-Hold';
    onHoldButton.className = 'onhold-button'; // Add a class for styling
    onHoldButton.onclick = () => markAsOnHold(onHoldButton);

    // Append buttons in the desired order
    newTask.appendChild(taskInput);
    newTask.appendChild(timeButtons);
    newTask.appendChild(onHoldButton);
    newTask.appendChild(deleteButton);
    newTask.appendChild(doneButton);

    todoColumn.appendChild(newTask);

    addDragAndDrop(newTask);
    updateCounts();
    saveTasks(firebase.auth().currentUser.uid);
}

// Function to add drag-and-drop functionality to tasks
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

// Functions for drag-and-drop
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
    saveTasks(firebase.auth().currentUser.uid);
}

function dragEnd(e) {
    e.target.style.display = 'flex';
    document.querySelectorAll('.drag-over').forEach(element => {
        element.classList.remove('drag-over');
    });
}

// Function to update task counts
function updateCounts() {
    document.getElementById('tasks-count').textContent = document.getElementById('todo-column').querySelectorAll('.todo-item').length;
    document.getElementById('onhold-count').textContent = document.getElementById('onhold-column').querySelectorAll('.todo-item').length;
    document.getElementById('completed-count').textContent = document.getElementById('done-column').querySelectorAll('.done-item').length;
}

// Event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            updateUserIcon(user.email);
            loadTasks(user.uid);
        } else {
            clearTasks();
        }
        updateCounts();
        showQuoteModal();
    });
});

// Function to show motivational quote modal
function showQuoteModal() {
    const modal = document.getElementById('quote-modal');
    const quoteElement = document.getElementById('motivational-quote');
    quoteElement.textContent = getRandomQuote();
    modal.classList.add('show');
}

// Function to close motivational quote modal
function closeQuoteModal() {
    const modal = document.getElementById('quote-modal');
    modal.classList.remove('show');
}
