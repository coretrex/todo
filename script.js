let timer;
let currentTaskElement;
let timerPaused = false;
let remainingTime = 0;
let endTime;

// Initialize Firestore
const db = firebase.firestore();

// List of motivational quotes
const quotes = [
    "The magic you are looking for is in the work you are avoiding",
    "The future depends on what you do today.",
    "Don’t fear failure. Fear being in the exact same place next year as you are today.",
    "If you want to be successful, you have to do what others are not willing to do.",
    "The only way to grow is to push yourself beyond what you think you can do.",
    "Great things never come from comfort zones.",
    "Don't stop when you're tired. Stop when you're done.",
    "Discipline is the shortcut. If you want to make it big, you have to stay disciplined every single day.",
    "Success isn't owned, it's leased. And rent is due every day."
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

// Event listeners for timer buttons
document.getElementById('done-timer-button').addEventListener('click', doneTimer);
document.getElementById('stop-timer-button').addEventListener('click', stopTimer);
document.getElementById('pause-timer-button').addEventListener('click', pauseTimer);
document.getElementById('start-timer-button').addEventListener('click', () => {
    startTimer(0, null, true);
});

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
    deleteButton.className = 'delete-button icon-button';
    deleteButton.onclick = () => deleteTask(deleteButton);
    deleteButton.innerHTML += '<span class="tooltip">Delete</span>';

    const onHoldButton = document.createElement('button');
    onHoldButton.className = 'onhold-button icon-button';
    onHoldButton.onclick = () => markAsOnHold(onHoldButton);
    onHoldButton.innerHTML += '<span class="tooltip">On-Hold</span>';

    const doneButton = document.createElement('button');
    doneButton.textContent = '✓';
    doneButton.className = 'done-button icon-button';
    doneButton.onclick = () => markAsDone(doneButton);
    doneButton.innerHTML += '<span class="tooltip">Done</span>';

    newTask.appendChild(taskInput);
    newTask.appendChild(timeButtons);

    if (!isDone && columnId !== 'onhold-column') {
        newTask.appendChild(onHoldButton);
        newTask.appendChild(doneButton);
    } else if (columnId === 'onhold-column') {
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
    document.getElementById('task-input-field').setAttribute('data-column', 'todo-column');
}

// Show the task input modal for On-Hold column
function showOnHoldTaskInputModal() {
    document.getElementById('task-input-modal').style.display = 'block';
    document.body.classList.add('blur-effect-enabled');
    document.getElementById('task-input-field').focus();
    document.getElementById('task-input-field').setAttribute('data-column', 'onhold-column');
}

// Hide the task input modal
function hideTaskInputModal() {
    document.getElementById('task-input-modal').style.display = 'none';
    document.body.classList.remove('blur-effect-enabled');
    document.getElementById('task-input-field').removeAttribute('data-column');
}

// Add event listener to show the task input modal when the add task button is clicked
document.getElementById('add-task-button').addEventListener('click', showTaskInputModal);

// Add event listener to show the task input modal when the add task button for On-Hold column is clicked
document.getElementById('add-onhold-task-button').addEventListener('click', showOnHoldTaskInputModal);

// Add event listener to handle task input
document.getElementById('task-input-field').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const taskTitle = event.target.value;
        const columnId = event.target.getAttribute('data-column') || 'todo-column';
        if (taskTitle.trim() !== '') {
            createTaskElement({ id: 'task-' + new Date().getTime(), title: taskTitle }, columnId);
            event.target.value = ''; // Clear the input field
            hideTaskInputModal();
            saveTasks(firebase.auth().currentUser.uid);
        }
    }
});

// Add event listener for clicks outside the task input modal to close it
document.addEventListener('click', function(event) {
    const taskInputModal = document.getElementById('task-input-modal');
    if (taskInputModal.style.display === 'block' && !taskInputModal.contains(event.target) && event.target.id !== 'add-task-button' && event.target.id !== 'add-onhold-task-button') {
        hideTaskInputModal();
    }
});

// Ensure the event listener for the "Stop Timer" button is correctly set
document.getElementById('stop-timer-button').addEventListener('click', stopTimer);

// Function to start the timer
function startTimer(minutes, button, resume = false) {
    clearInterval(timer);

    const beepSound = document.getElementById('beep-sound'); // Get the beep sound element

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

    document.getElementById('header-title').innerHTML = `<span class="working-on-light">Working on:</span> <strong>${taskTitle}</strong>`;

    hideNoteButtons();  // Hide all note buttons when the timer starts
    hideAddNoteButton();  // Hide the "Add Note" button when the timer starts

    timer = setInterval(() => {
        remainingTime = endTime - Date.now();
        if (remainingTime <= 0) {
            clearInterval(timer);
            document.getElementById('timer').textContent = '00:00';
            beepSound.play();  // Play beep when the timer ends
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



function hideNoteButtons() {
    const noteButtons = document.querySelectorAll('.note-button');
    noteButtons.forEach(button => {
        button.style.display = 'none';
    });
}

function showAddNoteButton() {
    const addNoteButton = document.getElementById('add-note-button');
    if (addNoteButton) {
        addNoteButton.style.display = 'inline-block';
    }
}


function showNoteButtons() {
    const noteButtons = document.querySelectorAll('.note-button');
    noteButtons.forEach(button => {
        button.style.display = 'inline-block';
    });
}


function hideAddNoteButton() {
    const addNoteButton = document.getElementById('add-note-button');
    if (addNoteButton) {
        addNoteButton.style.display = 'none';
    }
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
    }

    showNoteButtons();  // Show all note buttons when the timer stops
    showAddNoteButton();  // Show the "Add Note" button when the timer stops
}

function pauseTimer() {
    clearInterval(timer);
    timerPaused = true;
    remainingTime = endTime - Date.now(); // Calculate remaining time
    document.querySelectorAll('.blurred').forEach(element => {
        element.classList.remove('blurred');
    });

    document.getElementById('pause-timer-button').style.display = 'none';
    document.getElementById('start-timer-button').style.display = 'inline-block';

    showNoteButtons();  // Show all note buttons when the timer is paused
    showAddNoteButton();  // Show the "Add Note" button when the timer is paused
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
        const onHoldButton = draggable.querySelector('.onhold-button');
        const doneButton = draggable.querySelector('.done-button');
        if (e.target.id === 'done-column') {
            if (onHoldButton) onHoldButton.style.display = 'none';
            if (doneButton) doneButton.style.display = 'none';
        } else if (e.target.id === 'onhold-column') {
            if (onHoldButton) onHoldButton.style.display = 'none';
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
        if (user) {
            console.log('User is signed in:', user.email);
            clearTasks();
            loadTasks(user.uid);
            document.getElementById('add-task-button').addEventListener('click', showTaskInputModal);
            document.getElementById('add-onhold-task-button').addEventListener('click', showOnHoldTaskInputModal);
        } else {
            console.log('No user is signed in');
            window.location.href = 'login.html';
        }
        updateCounts();
        showQuoteModal();
    });
});



document.getElementById('add-task-button').addEventListener('click', showTaskInputModal);

function clearTasks() {
    // Clear the tasks from the UI to prevent duplication
    document.getElementById('todo-column').innerHTML = `
        <div class="todo-header">
            <h2>Tasks</h2>
            <button id="add-task-button">+</button>
        </div>`;
    document.getElementById('onhold-column').innerHTML = `
        <div class="onhold-header">
            <h2>On-Hold</h2>
            <button id="add-onhold-task-button">+</button>
        </div>`;
    document.getElementById('done-column').innerHTML = '<h2>Done</h2>';
}

function loadTasks(userId) {
    db.collection('tasks').doc(userId).get().then(doc => {
        if (doc.exists) {
            const tasks = doc.data();
            console.log('Loaded tasks:', tasks);

            // Clear existing tasks to prevent duplication
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

            // Re-attach event listener for "Add Task" button after clearing tasks
            document.getElementById('add-task-button').addEventListener('click', showTaskInputModal);
            document.getElementById('add-onhold-task-button').addEventListener('click', showOnHoldTaskInputModal);
        } else {
            console.log("No tasks found!");
        }
    }).catch(error => {
        console.error('Error loading tasks:', error);
    });
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
    deleteButton.className = 'delete-button icon-button';
    deleteButton.onclick = () => deleteTask(deleteButton);
    deleteButton.innerHTML += '<span class="tooltip">Delete</span>';

    const onHoldButton = document.createElement('button');
    onHoldButton.className = 'onhold-button icon-button';
    onHoldButton.onclick = () => markAsOnHold(onHoldButton);
    onHoldButton.innerHTML += '<span class="tooltip">On-Hold</span>';

    const doneButton = document.createElement('button');
    doneButton.textContent = '✓';
    doneButton.className = 'done-button icon-button';
    doneButton.onclick = () => markAsDone(doneButton);
    doneButton.innerHTML += '<span class="tooltip">Done</span>';

    newTask.appendChild(taskInput);
    newTask.appendChild(timeButtons);

    if (!isDone && columnId !== 'onhold-column') {
        newTask.appendChild(onHoldButton);
        newTask.appendChild(doneButton);
    } else if (columnId === 'onhold-column') {
        newTask.appendChild(doneButton);
    }

    newTask.appendChild(deleteButton);
    column.appendChild(newTask);

    addDragAndDrop(newTask);
}

function addDragAndDrop(task) {
    task.addEventListener('dragstart', dragStart);
    task.addEventListener('dragend', dragEnd);
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
    setTimeout(() => {
        e.target.style.display = 'none';
    }, 0);
}

function dragEnd(e) {
    e.target.style.display = 'flex';
    document.querySelectorAll('.drag-over').forEach(element => {
        element.classList.remove('drag-over');
    });
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
        const onHoldButton = draggable.querySelector('.onhold-button');
        const doneButton = draggable.querySelector('.done-button');
        if (e.target.id === 'done-column') {
            if (onHoldButton) onHoldButton.style.display = 'none';
            if (doneButton) doneButton.style.display = 'none';
        } else if (e.target.id === 'onhold-column') {
            if (onHoldButton) onHoldButton.style.display = 'none';
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

function updateCounts() {
    document.getElementById('tasks-count').textContent = document.getElementById('todo-column').querySelectorAll('.todo-item').length;
    document.getElementById('onhold-count').textContent = document.getElementById('onhold-column').querySelectorAll('.todo-item').length;
    document.getElementById('completed-count').textContent = document.getElementById('done-column').querySelectorAll('.done-item').length;
}
// ... existing code ...

// Add these functions at the end of your script.js file

function updateUserUI(user) {
    const loginButton = document.getElementById('login-button');
    const userMenu = document.getElementById('user-menu');
    const userIcon = document.getElementById('user-icon');
    const logoutButton = document.getElementById('logout-button');

    if (user) {
        // User is signed in
        loginButton.style.display = 'none';
        userMenu.style.display = 'flex';
        userIcon.textContent = user.email.charAt(0).toUpperCase();
        
        // Toggle logout button visibility on user menu click
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent this click from immediately hiding the logout button
            logoutButton.style.display = logoutButton.style.display === 'block' ? 'none' : 'block';
        });
        
        // Add click event for logout
        logoutButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent this click from bubbling up to the userMenu
            firebase.auth().signOut().then(() => {
                console.log('User signed out');
                window.location.href = 'login.html';
            }).catch((error) => {
                console.error('Sign out error', error);
            });
        });

        // Hide logout button when clicking outside
        document.addEventListener('click', () => {
            logoutButton.style.display = 'none';
        });
    } else {
        // No user is signed in
        loginButton.style.display = 'block';
        userMenu.style.display = 'none';
    }
}

// Modify the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log('User is signed in:', user.email);
            clearTasks();
            loadTasks(user.uid);
            document.getElementById('add-task-button').addEventListener('click', showTaskInputModal);
            document.getElementById('add-onhold-task-button').addEventListener('click', showOnHoldTaskInputModal);
            updateUserUI(user);  // Add this line
        } else {
            console.log('No user is signed in');
            window.location.href = 'login.html';
        }
        updateCounts();
        showQuoteModal();
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const addNoteButton = document.getElementById('add-note-button');
    const buttonContainer = document.getElementById('button-container');

    // Function to create the new note button and modal
    function createNoteButton(uniqueId) {
        if (!document.querySelector(`[data-id="${uniqueId}"]`)) {
            const newNoteButton = document.createElement('button');
            newNoteButton.textContent = 'New Note';
            newNoteButton.className = 'note-button';
            newNoteButton.setAttribute('data-id', uniqueId);
            newNoteButton.style.backgroundColor = '#FFA500'; // Default to orange

            newNoteButton.addEventListener('click', () => openNoteModal(uniqueId));

            buttonContainer.insertBefore(newNoteButton, addNoteButton);
            createNoteModal(uniqueId);
        }
    }

    // Function to create a note modal
    function createNoteModal(uniqueId) {
        const noteModal = document.createElement('div');
        noteModal.className = 'modal';
        noteModal.id = `note-modal-${uniqueId}`;
    
        noteModal.innerHTML = `
            <div class="modal-content">
                <span class="close-note" data-id="${uniqueId}">&times;</span>
                <h2><input type="text" id="note-title-${uniqueId}" placeholder="Note Title" class="note-title-input"></h2>
                <textarea id="note-textarea-${uniqueId}" placeholder="Enter your note here" rows="10" cols="50"></textarea>
                <label for="note-color-${uniqueId}">Select Button Color:</label>
                <input type="color" id="note-color-${uniqueId}" class="note-color-picker" value="#ffffff">
                <button id="save-note-${uniqueId}" class="outline-button">Save Note</button>
                <button id="delete-note-${uniqueId}" class="delete-note-btn">Delete Note</button>
            </div>
        `;
        document.body.appendChild(noteModal);
    
        // Load the existing note data from Firebase
        loadNoteFromFirebase(uniqueId);
    
        // Add event listeners for save and delete actions
        document.getElementById(`save-note-${uniqueId}`).addEventListener('click', () => saveNoteContent(uniqueId));
        document.getElementById(`delete-note-${uniqueId}`).addEventListener('click', () => deleteNoteContent(uniqueId));
        document.querySelector(`.close-note[data-id="${uniqueId}"]`).addEventListener('click', () => closeNoteModal(uniqueId));
    }
    

    // Function to open the note modal
    function openNoteModal(uniqueId) {
        const noteModal = document.getElementById(`note-modal-${uniqueId}`);
        noteModal.style.display = 'block';
    }

    // Function to close the note modal
    function closeNoteModal(uniqueId) {
        document.getElementById(`note-modal-${uniqueId}`).style.display = 'none';
    }

    // Function to save the note content and title to Firebase
    function saveNoteContent(uniqueId) {
        const noteContent = document.getElementById(`note-textarea-${uniqueId}`).value;
        const noteTitle = document.getElementById(`note-title-${uniqueId}`).value || 'New Note'; // Fetch title from input
        const noteColor = document.getElementById(`note-color-${uniqueId}`).value;
    
        uniqueId = uniqueId.toString(); // Ensure uniqueId is a string
    
        const userId = firebase.auth().currentUser.uid;
    
        // Save the note content, title, and color to Firebase
        db.collection('notes').doc(userId).collection('userNotes').doc(uniqueId).set({
            content: noteContent,
            title: noteTitle,  // Ensure title is being saved
            color: noteColor
        })
        .then(() => {
            console.log("Note successfully saved!");
    
            // Update the button text to match the note title
            const noteButton = document.querySelector(`[data-id="${uniqueId}"]`);
            if (noteButton) {
                noteButton.textContent = noteTitle; // Update the button text to the new note title
            }
    
            // Update button color if changed
            noteButton.style.backgroundColor = noteColor;
        })
        .catch((error) => {
            console.error("Error saving note: ", error);
        });
    }
    
    
    

    // Function to load the note from Firebase
    function loadNoteFromFirebase(uniqueId) {
        const userId = firebase.auth().currentUser.uid;
        firebase.firestore().collection('notes').doc(userId).collection('userNotes').doc(uniqueId.toString()).get()
            .then((doc) => {
                if (doc.exists) {
                    const noteData = doc.data();
                    const noteButton = document.querySelector(`[data-id="${uniqueId}"]`);
                    
                    // Load the note title
                    if (typeof noteData.title === 'string') {
                        document.getElementById(`note-title-${uniqueId}`).value = noteData.title || '';
                        
                        // Update button title with the loaded note title
                        if (noteButton) {
                            noteButton.textContent = noteData.title || 'New Note';
                        }
                    }
                    
                    // Load the note content
                    if (typeof noteData.content === 'string') {
                        document.getElementById(`note-textarea-${uniqueId}`).value = noteData.content || '';
                    }
    
                    // Load the note color
                    if (typeof noteData.color === 'string') {
                        document.getElementById(`note-color-${uniqueId}`).value = noteData.color || '#ffffff';
                        if (noteButton) {
                            noteButton.style.backgroundColor = noteData.color || '#FFA500';
                        }
                    }
                }
            })
            .catch((error) => {
                console.error("Error loading note: ", error);
            });
    }
    
    
    

    // Function to delete the note and the button
    function deleteNoteContent(uniqueId) {
        const userId = firebase.auth().currentUser.uid;
        
        // Ensure uniqueId is treated as a string
        uniqueId = String(uniqueId);
        
        firebase.firestore().collection('notes').doc(userId).collection('userNotes').doc(uniqueId).delete()
            .then(() => {
                console.log("Note successfully deleted!");
                document.querySelector(`[data-id="${uniqueId}"]`).remove(); // Remove the button
                document.getElementById(`note-modal-${uniqueId}`).remove(); // Remove the modal
            })
            .catch((error) => {
                console.error("Error deleting note: ", error);
            });
    }
    

    // Event listener for adding a new note button
    addNoteButton.addEventListener('click', () => {
        const uniqueId = new Date().getTime(); // Generate a unique ID for each note button and modal
        createNoteButton(uniqueId);
    });

    // Load existing note buttons from Firebase
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            const userId = user.uid;
            firebase.firestore().collection('notes').doc(userId).collection('userNotes').get()
                .then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        const uniqueId = doc.id;
                        createNoteButton(uniqueId);
                    });
                })
                .catch((error) => {
                    console.error("Error loading existing notes: ", error);
                });
        }
    });

    // Close modals if clicked outside
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});

