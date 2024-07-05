// script.js

let timer;
let currentTaskElement;
let timerPaused = false;
let remainingTime = 0;
let endTime;

// Initialize Firestore
const db = firebase.firestore();

// List of motivational quotes
const quotes = [
    "The way to get started is to quit talking and begin doing.",
    "The future depends on what you do today.",
    "Don’t fear failure. Fear being in the exact same place next year as you are today.",
    "If you want to be successful, you have to do what others are not willing to do.",
    "The only way to grow is to push yourself beyond what you think you can do.",
    "Great things never come from comfort zones.",
    "Don't stop when you're tired. Stop when you're done.",
    "Discipline is the shortcut. If you want to make it big, you have to stay disciplined every single day.",
    "Success isn’t owned, it’s leased. And rent is due every day."
];

// Function to get a random quote
function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
}

// Function to show the quote modal
function showQuoteModal() {
    const modal = document.getElementById('quote-modal');
    const quoteElement = document.getElementById('motivational-quote');
    quoteElement.textContent = getRandomQuote();
    modal.classList.add('show');
}

// Function to close the quote modal
function closeQuoteModal() {
    const modal = document.getElementById('quote-modal');
    modal.classList.remove('show');
}

document.getElementById('quote-button').addEventListener('click', closeQuoteModal);

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
document.getElementById('google-login').addEventListener('click', signInWithGoogle);
document.getElementById('user-icon').addEventListener('click', toggleUserMenu);
document.getElementById('logout-button').addEventListener('click', logOut);
document.getElementById('done-timer-button').addEventListener('click', doneTimer);
document.getElementById('stop-timer-button').addEventListener('click', stopTimer);
document.getElementById('pause-timer-button').addEventListener('click', pauseTimer);

// Function for Google Sign-In
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(result => {
            console.log('Google Sign-In successful');
            document.getElementById('login-modal').style.display = 'none';
            updateUserIcon(result.user.email);
            loadTasks(result.user.uid);
        })
        .catch(error => {
            console.error('Error during Google Sign-In:', error.message);
            alert(error.message);
        });
}

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
    console.log("updateUserIcon called with email:", email);
    const loginButton = document.getElementById('login-button');
    const userMenu = document.getElementById('user-menu');
    const userIcon = document.getElementById('user-icon');
    const addTaskButton = document.getElementById('add-task-button');

    loginButton.style.display = 'none';
    userIcon.textContent = email.charAt(0).toUpperCase();
    userMenu.style.display = 'flex';

    // Ensure the add task button is displayed
    if (addTaskButton) {
        console.log("Displaying Add Task button");
        addTaskButton.style.display = 'block';
    } else {
        console.error("Add Task button not found");
    }
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

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'x';
    deleteButton.className = 'delete-button';
    deleteButton.onclick = () => deleteTask(deleteButton);

    newTask.appendChild(taskInput);
    newTask.appendChild(timeButtons);

    if (!isDone && columnId !== 'onhold-column') {
        const onHoldButton = document.createElement('button');
        onHoldButton.className = 'onhold-button';
        onHoldButton.onclick = () => markAsOnHold(onHoldButton);
        newTask.appendChild(onHoldButton);

        const doneButton = document.createElement('button');
        doneButton.textContent = '✓';
        doneButton.className = 'done-button';
        doneButton.onclick = () => markAsDone(doneButton);
        newTask.appendChild(doneButton);
    } else if (columnId === 'onhold-column') {
        const doneButton = document.createElement('button');
        doneButton.textContent = '✓';
        doneButton.className = 'done-button';
        doneButton.onclick = () => markAsDone(doneButton);
        newTask.appendChild(doneButton);
    }

    newTask.appendChild(deleteButton);
    column.appendChild(newTask);

    addDragAndDrop(newTask);
}

// Function to add a new task
function addTask(taskTitle) {
    const todoColumn = document.getElementById('todo-column');
    const newTask = document.createElement('div');
    newTask.className = 'todo-item';
    newTask.draggable = true;
    newTask.id = 'task-' + new Date().getTime();

    const taskInput = document.createElement('input');
    taskInput.type = 'text';
    taskInput.value = taskTitle;
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

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'x';
    deleteButton.className = 'delete-button';
    deleteButton.onclick = () => deleteTask(deleteButton);

    const onHoldButton = document.createElement('button');
    onHoldButton.className = 'onhold-button';
    onHoldButton.onclick = () => markAsOnHold(onHoldButton);

    const doneButton = document.createElement('button');
    doneButton.textContent = '✓';
    doneButton.className = 'done-button';
    doneButton.onclick = () => markAsDone(doneButton);

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

// Show the task input modal
function showTaskInputModal() {
    document.getElementById('task-input-modal').style.display = 'block';
    document.body.classList.add('blur-effect-enabled');
    document.getElementById('task-input-field').focus();
}

// Hide the task input modal
function hideTaskInputModal() {
    document.getElementById('task-input-modal').style.display = 'none';
    document.body.classList.remove('blur-effect-enabled');
}

// Add event listener to show the task input modal when the add task button is clicked
document.getElementById('add-task-button').addEventListener('click', showTaskInputModal);

// Add event listener to handle task input
document.getElementById('task-input-field').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const taskTitle = event.target.value;
        if (taskTitle.trim() !== '') {
            createTaskElement({ id: 'task-' + new Date().getTime(), title: taskTitle }, 'todo-column');
            event.target.value = ''; // Clear the input field
            hideTaskInputModal();
            saveTasks(firebase.auth().currentUser.uid);
        }
    }
});

// Ensure the event listener for the "Stop Timer" button is correctly set
document.getElementById('stop-timer-button').addEventListener('click', stopTimer);

// Function to start the timer
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

    // Apply the new class to the "Working on:" text
    document.getElementById('header-title').innerHTML = `<span class="working-on-light">Working on:</span> <strong>${taskTitle}</strong>`;

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
    document.getElementById('done-timer-button').style.display = 'inline-block'; // Show Done button
    document.getElementById('start-timer-button').style.display = 'none';
}

// Function to stop the timer
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

    const doneButton = document.getElementById('done-timer-button');
    if (doneButton) {
        doneButton.style.display = 'none'; // Ensure Done button is hidden
    } else {
        console.error("Done button not found");
    }
}

// Function to pause the timer
function pauseTimer() {
    clearInterval(timer);
    timerPaused = true;
    remainingTime = endTime - Date.now(); // Calculate remaining time
    document.querySelectorAll('.blurred').forEach(element => {
        element.classList.remove('blurred');
    });

    document.getElementById('pause-timer-button').style.display = 'none';
    document.getElementById('start-timer-button').style.display = 'inline-block';
}

// Function to mark the task as done
function doneTimer() {
    if (currentTaskElement) {
        const doneButton = currentTaskElement.querySelector('.done-button');
        markAsDone(doneButton);
        stopTimer();
        document.getElementById('done-timer-button').style.display = 'none'; // Hide Done button after clicking
    }
}

function markAsDone(button) {
    const task = button.parentElement;
    task.classList.add('done-item');
    task.draggable = false;

    // Hide the "On-Hold" button
    const onHoldButton = task.querySelector('.onhold-button');
    if (onHoldButton) {
        onHoldButton.style.display = 'none';
    }

    // Remove the "Done" button
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

function markAsOnHold(button) {
    stopTimer();
    const task = button.parentElement;

    // Hide the "On-Hold" button
    const onHoldButton = task.querySelector('.onhold-button');
    if (onHoldButton) {
        onHoldButton.style.display = 'none';
    }

    // Ensure the "Done" button is displayed
    const doneButton = task.querySelector('.done-button');
    if (doneButton) {
        doneButton.style.display = 'inline-block';
    }

    document.getElementById('onhold-column').appendChild(task);
    updateCounts();
    saveTasks(firebase.auth().currentUser.uid);
}

function deleteTask(button) {
    const task = button.parentElement;
    task.remove();
    updateCounts();
    saveTasks(firebase.auth().currentUser.uid);
}

function addDragAndDrop(task) {
    task.addEventListener('dragstart', dragStart);
    task.addEventListener('dragend', dragEnd);
}

document.querySelectorAll('.todo-item, .done-item').forEach(item => {
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
        // Show/hide appropriate buttons
        const onHoldButton = draggable.querySelector('.onhold-button');
        const doneButton = draggable.querySelector('.done-button');
        if (e.target.id === 'done-column') {
            if (onHoldButton) onHoldButton.style.display = 'none';
            if (doneButton) doneButton.style.display = 'none';
        } else if (e.target.id === 'onhold-column') {
            if (onHoldButton) onHoldButton.style.display = 'none'; // Hide the "On-Hold" button immediately
            if (doneButton) doneButton.style.display = 'inline-block';
        } else {
            if (onHoldButton) onHoldButton.style.display = 'inline-block';
            if (doneButton) doneButton.style.display = 'inline-block';
        }
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

function updateCounts() {
    document.getElementById('tasks-count').textContent = document.getElementById('todo-column').querySelectorAll('.todo-item').length;
    document.getElementById('onhold-count').textContent = document.getElementById('onhold-column').querySelectorAll('.todo-item').length;
    document.getElementById('completed-count').textContent = document.getElementById('done-column').querySelectorAll('.done-item').length;
}

document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged(user => {
        const addTaskButton = document.getElementById('add-task-button');
        console.log("Auth state changed. User:", user);

        if (user) {
            updateUserIcon(user.email);
            loadTasks(user.uid);
            
            // Ensure the add task button is displayed
            if (addTaskButton) {
                console.log("Displaying Add Task button after auth state change");
                addTaskButton.style.display = 'block';
            } else {
                console.error("Add Task button not found");
            }
        } else {
            clearTasks();
            // Hide the add task button if no user is logged in
            if (addTaskButton) {
                console.log("Hiding Add Task button as no user is logged in");
                addTaskButton.style.display = 'none';
            }
        }
        updateCounts();
        showQuoteModal();
    });
});
