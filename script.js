// DOM Elements
const taskInput = document.getElementById('taskInput');
const taskDate = document.getElementById('taskDate');
const taskTime = document.getElementById('taskTime');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');

// Set default date to today
const today = new Date();
const todayFormatted = today.toISOString().split('T')[0];
taskDate.min = todayFormatted;
taskDate.value = todayFormatted;

// Set default time to next hour
const nextHour = new Date();
nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
taskTime.value = nextHour.toTimeString().substring(0, 5);

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
    updateTaskCount();
    
    // Focus input on load
    taskInput.focus();
});

// Format date to display
function formatDate(dateString) {
    if (!dateString) return '';
    
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
    };
    
    return new Date(dateString).toLocaleDateString('uz-UZ', options);
}

// Format time to display
function formatTime(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
}

// Check if a task is due today
function isDueToday(dateString) {
    if (!dateString) return false;
    
    const today = new Date().toDateString();
    const taskDate = new Date(dateString).toDateString();
    return today === taskDate;
}

// Check if a task is overdue
function isOverdue(dateString, timeString) {
    if (!dateString) return false;
    
    const now = new Date();
    const taskDateTime = new Date(`${dateString}T${timeString || '23:59'}`);
    
    return taskDateTime < now && !isDueToday(dateString);
}

// Add a new task with animation
function addTask() {
    const taskText = taskInput.value.trim();
    const dueDate = taskDate.value;
    const dueTime = taskTime.value;
    
    if (!taskText) {
        showNotification('Iltimos, vazifani kiriting!');
        return;
    }
    
    const task = {
        id: Date.now(),
        text: taskText,
        dueDate,
        dueTime,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    addTaskToDOM(task);
    saveTasks();
    taskInput.value = '';
    taskDate.value = todayFormatted;
    taskTime.value = nextHour.toTimeString().substring(0, 5);
    updateTaskCount();
    
    // Add animation
    const newTask = taskList.firstElementChild;
    if (newTask) {
        newTask.style.animation = 'none';
        void newTask.offsetWidth; // Trigger reflow
        newTask.style.animation = 'fadeIn 0.3s ease-out';
    }
}

// Add task to DOM
function addTaskToDOM(task) {
    const li = document.createElement('li');
    li.setAttribute('data-id', task.id);
    
    // Create task content container
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';
    
    // Create task text with checkbox
    const taskSpan = document.createElement('span');
    taskSpan.textContent = task.text;
    if (task.completed) {
        taskSpan.classList.add('completed');
    }
    
    // Create task meta info (date and time)
    const taskMeta = document.createElement('div');
    taskMeta.className = 'task-meta';
    
    if (task.dueDate) {
        const taskDue = document.createElement('div');
        taskDue.className = 'task-due';
        
        // Add appropriate class based on due date
        if (isOverdue(task.dueDate, task.dueTime) && !task.completed) {
            taskDue.classList.add('task-overdue');
        } else if (isDueToday(task.dueDate) && !task.completed) {
            taskDue.classList.add('task-today');
        }
        
        // Add calendar icon
        const calendarIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        calendarIcon.setAttribute('width', '14');
        calendarIcon.setAttribute('height', '14');
        calendarIcon.setAttribute('viewBox', '0 0 24 24');
        calendarIcon.setAttribute('fill', 'none');
        calendarIcon.setAttribute('stroke', 'currentColor');
        calendarIcon.setAttribute('stroke-width', '2');
        calendarIcon.setAttribute('stroke-linecap', 'round');
        calendarIcon.setAttribute('stroke-linejoin', 'round');
        calendarIcon.innerHTML = '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>';
        
        // Format date and time for display
        const formattedDate = formatDate(task.dueDate);
        const formattedTime = task.dueTime ? `, ${formatTime(task.dueTime)}` : '';
        
        taskDue.appendChild(calendarIcon);
        taskDue.appendChild(document.createTextNode(`${formattedDate}${formattedTime}`));
        taskMeta.appendChild(taskDue);
    }
    
    // Create delete button with icon
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('aria-label', 'Vazifani o\'chirish');
    deleteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    `;
    
    // Add event listeners
    taskSpan.addEventListener('click', () => toggleTaskCompletion(li, taskSpan));
    deleteBtn.addEventListener('click', () => deleteTask(li, task.id));
    
    // Add swipe to delete on touch devices
    setupSwipeToDelete(li);
    
    // Append elements
    taskContent.appendChild(taskSpan);
    taskContent.appendChild(deleteBtn);
    
    li.appendChild(taskContent);
    if (taskMeta.hasChildNodes()) {
        li.appendChild(taskMeta);
    }
    
    // Add to the top of the list
    taskList.insertBefore(li, taskList.firstChild);
}

// Toggle task completion
function toggleTaskCompletion(li, taskSpan) {
    taskSpan.classList.toggle('completed');
    saveTasks();
    updateTaskCount();
    
    // Add animation
    li.style.transform = 'scale(0.98)';
    setTimeout(() => {
        li.style.transform = '';
    }, 150);
}

// Delete task with animation
function deleteTask(li, taskId) {
    li.style.animation = 'fadeOut 0.3s ease-out';
    li.addEventListener('animationend', () => {
        li.remove();
        saveTasks();
        updateTaskCount();
        showNotification('Vazifa o\'chirildi');
    }, { once: true });
}

// Save tasks to localStorage
function saveTasks() {
    const tasks = [];
    document.querySelectorAll('#taskList li').forEach(taskItem => {
        const taskSpan = taskItem.querySelector('span');
        const taskMeta = taskItem.querySelector('.task-meta');
        const taskDue = taskMeta ? taskMeta.querySelector('.task-due') : null;
        
        const task = {
            id: taskItem.getAttribute('data-id'),
            text: taskSpan.textContent,
            completed: taskSpan.classList.contains('completed'),
            createdAt: taskItem.getAttribute('data-created') || new Date().toISOString()
        };
        
        if (taskDue) {
            // Extract date and time from the task due text
            const dueText = taskDue.textContent.trim();
            const [datePart, timePart] = dueText.split(',');
            
            if (datePart) {
                const date = new Date(datePart);
                if (!isNaN(date.getTime())) {
                    task.dueDate = date.toISOString().split('T')[0];
                }
            }
            
            if (timePart) {
                task.dueTime = timePart.trim();
            }
        }
        
        tasks.push(task);
    });
    
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Sort tasks by due date and time
function sortTasks(tasks) {
    return tasks.sort((a, b) => {
        // Move completed tasks to the bottom
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        
        // Sort by due date and time
        if (a.dueDate && b.dueDate) {
            const dateA = new Date(`${a.dueDate}T${a.dueTime || '23:59'}`);
            const dateB = new Date(`${b.dueDate}T${b.dueTime || '23:59'}`);
            
            // Overdue tasks first, then today's tasks, then future tasks
            const now = new Date();
            const isAOverdue = dateA < now && !isDueToday(a.dueDate);
            const isBOverdue = dateB < now && !isDueToday(b.dueDate);
            const isAToday = isDueToday(a.dueDate);
            const isBToday = isDueToday(b.dueDate);
            
            if (isAOverdue && !isBOverdue) return -1;
            if (!isAOverdue && isBOverdue) return 1;
            if (isAToday && !isBToday) return -1;
            if (!isAToday && isBToday) return 1;
            
            // If both are in the same category, sort by date/time
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
            
            // If same date, sort by time
            if (a.dueTime && b.dueTime) {
                return a.dueTime.localeCompare(b.dueTime);
            }
        }
        
        // If no due dates or same date/time, sort by creation time
        const createdA = new Date(a.createdAt || 0);
        const createdB = new Date(b.createdAt || 0);
        return createdB - createdA;
    });
}

// Load tasks from localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        try {
            let tasks = JSON.parse(savedTasks);
            tasks = sortTasks(tasks);
            tasks.forEach(task => addTaskToDOM(task));
        } catch (e) {
            console.error('Error loading tasks:', e);
            localStorage.removeItem('tasks'); // Clear corrupted data
        }
    }
}

// Update task counter
function updateTaskCount() {
    const totalTasks = document.querySelectorAll('#taskList li').length;
    const completedTasks = document.querySelectorAll('#taskList li span.completed').length;
    const remainingTasks = totalTasks - completedTasks;
    
    taskCount.textContent = `${remainingTasks} ta qoldi, ${completedTasks} ta bajarildi`;
    
    // Hide counter if no tasks
    taskCount.style.display = totalTasks ? 'block' : 'none';
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Add show class after a small delay
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Swipe to delete functionality
function setupSwipeToDelete(li) {
    let touchStartX = 0;
    let touchEndX = 0;
    
    li.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    li.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        
        // If swiped left more than 50px
        if (diff > 50) {
            li.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                deleteTask(li, li.getAttribute('data-id'));
            }, 300);
        }
    }, { passive: true });
}

// Add animation for notification
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        to { opacity: 0; transform: translateX(-100%); }
    }
    
    .notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100%);
        background: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-size: 14px;
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .notification.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
`;
document.head.appendChild(style);