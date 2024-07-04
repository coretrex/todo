let timer;
let currentTaskElement;

document.getElementById('add-task-button').addEventListener('click', addTask);
document.getElementById('stop-timer-button').addEventListener('click', stopTimer);
document.getElementById('quote-button').addEventListener('click', closeQuoteModal);

const quotes = [
    "When you think you're done, you're only at 40% of your body's capability. - David Goggins",
    "Pain unlocks a secret doorway in the mind, one that leads to both peak performance and beautiful silence. - David Goggins",
    "Be more than motivated, be more than driven, become literally obsessed to the point where people think you’re insane. - David Goggins",
    "Greatness pulls mediocrity into the mud. Get out there and get after it. - David Goggins",
    "We don't rise to the level of our expectations, we fall to the level of our training. - David Goggins",
    "You are in danger of living a life so comfortable and soft, that you will die without ever realizing your true potential. - David Goggins",
    "Don’t stop when you’re tired. Stop when you’re done. - David Goggins",
    "Every day you have to do this. You have to do this. Because why not? - David Goggins",
    "You have to build calluses on your brain just like how you build calluses on your hands. Callus your mind through pain and suffering. - David Goggins",
    "You will never learn from people if you always tap dance around the truth. - David Goggins",
    "It's okay, you’re not going to die. At the end of pain is success. - David Goggins",
    "Suffering is a test. That's all it is. Suffering is the true test of life. - David Goggins",
    "No matter what avenue I chose, I wanted to be the very best at that avenue. - David Goggins",
    "You have to master your mind to master the pain and suffering. - David Goggins",
    "The only way to reach the other side of this journey is to suffer. - David Goggins",
    "This is not about getting better than someone else, this is about being the best you. - David Goggins",
    "Everything in life is a mind game! Whenever we get swept under by life's dramas, large and small, we are forgetting that no matter how bad the pain gets, no matter how harrowing the torture, all bad things end. - David Goggins",
    "If you can see yourself doing something, you can do it. If you can't see yourself doing it, usually you can't achieve it. - David Goggins",
    "You have to be willing to suffer to get to the other side of greatness. - David Goggins",
    "Motivation is crap. Motivation comes and goes. When you’re driven, whatever is in front of you will get destroyed. - David Goggins",
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
    "What lies behind us and what lies before us are tiny matters compared to what lies within us. - Ralph Waldo Emerson",
    "The only thing standing between you and your goal is the story you keep telling yourself as to why you can't achieve it. - Jordan Belfort"
];

function getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
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
    loadTasks();
    updateCounts();
    showQuoteModal();
});

function saveTasks() {
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

    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        const tasks = JSON.parse(savedTasks);

        tasks.todo.forEach(task => {
            createTaskElement(task, 'todo-column');
        });

        tasks.onhold.forEach(task => {
            createTaskElement(task, 'onhold-column');
        });

        tasks.done.forEach(task => {
            createTaskElement(task, 'done-column', true);
        });
    }
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
