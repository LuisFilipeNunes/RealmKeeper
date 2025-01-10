const realmId = document.querySelector('[data-realm-id]').dataset.realmId;
const menuToggle = document.querySelector('.menu-toggle');
const sideMenu = document.querySelector('.side-menu');
const mainContent = document.querySelector('.main-content');
const filterHandlers = {
    '#annotations': 'lore',
    '#persons': 'person',
    '#artifacts': 'item',
    '#locations': 'place'
};


document.getElementById('openNodeModalButton').addEventListener('click', function() {
    document.getElementById('nodeModal').style.display = 'block';
});
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('nodeModal').style.display = 'none';
});

window.onclick = function(event) {
    if (event.target == document.getElementById('nodeModal')) {
        document.getElementById('nodeModal').style.display = 'none';
    }
};

Object.entries(filterHandlers).forEach(([selector, nodeType]) => {
    document.querySelector(`a[href="${selector}"]`).addEventListener('click', function(e) {
        e.preventDefault();
        const menuItem = this.parentElement;

        if (menuItem.classList.contains('selected')) {
            menuItem.classList.remove('selected');
            const nodeCards = document.querySelectorAll('.node-card');
            nodeCards.forEach(card => {
                card.style.display = 'block';
            });
            const noResults = document.querySelector('.no-results');
            if (noResults) noResults.remove();
        } else {
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('selected');
            });

            menuItem.classList.add('selected');
            const nodeCards = document.querySelectorAll('.node-card');
            let hasVisibleCards = false;

            nodeCards.forEach(card => {
                const cardType = card.querySelector('.node-type').textContent;
                if (cardType.toLowerCase() === nodeType) {
                    card.style.display = 'block';
                    hasVisibleCards = true;
                } else {
                    card.style.display = 'none';
                }
            });

            let noResults = document.querySelector('.no-results');
            if (!hasVisibleCards) {
                if (!noResults) {
                    noResults = document.createElement('div');
                    noResults.className = 'no-results empty-realm';
                    noResults.innerHTML = `
                        <i class="fas fa-search fa-4x"></i>
                        <h2>No content found</h2>
                        <p>There are no entries for this category yet.</p>
                    `;
                    document.querySelector('.nodes-grid').appendChild(noResults);
                }
            } else if (noResults) {
                noResults.remove();
            }
        }
    });
});

menuToggle.addEventListener('click', () => {
    sideMenu.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');

    const icon = menuToggle.querySelector('i');
    if (icon.classList.contains('fa-chevron-left')) {
        icon.classList.replace('fa-chevron-left', 'fa-chevron-right');
    } else {
        icon.classList.replace('fa-chevron-right', 'fa-chevron-left');
    }
});

function openAccessModal() {
    document.getElementById('accessModal').style.display = 'block';
}

function closeAccessModal() {
    document.getElementById('accessModal').style.display = 'none';
}

function closeNodeModal() {
    document.getElementById('nodeModal').style.display = 'none';
}

async function addNewPermission(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const permissionLevel = document.getElementById('permissionLevel').value;
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    
    try {
        const response = await fetch(`/realms/${realmId}/permissions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                username: username,
                permission_level: permissionLevel
            })
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        if (response.ok) {
            // Clear the form inputs
            document.getElementById('username').value = '';
            document.getElementById('permissionLevel').value = '';
            
            // Fetch and update the permissions list
            const permissionsResponse = await fetch(`/realms/${realmId}/permissions`);
            console.log('Permissions response:', permissionsResponse);
            const permissionsData = await permissionsResponse.json();
            console.log('Permissions data:', permissionsData);
            // Update the permissions list in the modal
            // const permissionsList = document.querySelector('.permissions-list');
            const editorsList = document.querySelector('.admin-user-list');
            const viewersList = document.querySelector('.viewer-user-list');
            
            editorsList.innerHTML = '';
            viewersList.innerHTML = '';

            // Add editors (admins)
            permissionsData.editors.forEach(editor => {
                const editorItem = document.createElement('div');
                editorItem.className = 'user-badge admin';
                editorItem.innerHTML = `

                    ${editor.username}
                    <button class="remove-user" onclick="removeUser('${editor.username}', 'admin')">
                        <i class="fas fa-times"></i>
                    </button>

                    
                `;
                editorsList.appendChild(editorItem);
            });

            // Add viewers
            permissionsData.viewers.forEach(viewer => {
                const viewerItem = document.createElement('div');
                viewerItem.className = 'user-badge viewer';
                viewerItem.innerHTML = `

                    ${viewer.username}
                    <button class="remove-user" onclick="removeUser('${viewer.username}', 'viewer')">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                viewersList.appendChild(viewerItem);
            });
            
            showNotification(data.message, 'success');
        } else {
            showNotification(data.message, 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to add permission', 'error');
    }
}

async function removeUser(username, role) {
    const modal = document.getElementById('confirmationModal');
    const confirmMessage = document.getElementById('confirmationMessage');
    const confirmBtn = document.getElementById('confirmRemoveBtn');
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    
    confirmMessage.textContent = `Are you sure you want to remove ${username}'s ${role} access?`;
    modal.style.display = 'block';
    
    return new Promise((resolve) => {
        confirmBtn.onclick = async () => {
            modal.style.display = 'none';
            
            try {
                const response = await fetch(`/realms/${realmId}/permissions`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({
                        username: username,
                        role: role
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    showNotification(data.message, 'error');
                    return;
                }

                // Fetch and update the permissions list
                const permissionsResponse = await fetch(`/realms/${realmId}/permissions`);
                const permissionsData = await permissionsResponse.json();
                
                // Update the lists in the modal
                const adminList = document.getElementById('accessModal').querySelector('.admin-user-list');
                const viewerList = document.getElementById('accessModal').querySelector('.viewer-user-list');
                
                adminList.innerHTML = '';
                viewerList.innerHTML = '';

                // Add editors
                permissionsData.editors.forEach(editor => {
                    const editorItem = document.createElement('div');
                    editorItem.className = 'user-badge admin';
                    editorItem.innerHTML = `
                        ${editor.username}
                        <button class="remove-user" onclick="removeUser('${editor.username}', 'admin')">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    adminList.appendChild(editorItem);
                });

                // Add viewers
                permissionsData.viewers.forEach(viewer => {
                    const viewerItem = document.createElement('div');
                    viewerItem.className = 'user-badge viewer';
                    viewerItem.innerHTML = `
                        ${viewer.username}
                        <button class="remove-user" onclick="removeUser('${viewer.username}', 'viewer')">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    viewerList.appendChild(viewerItem);
                });
                
                showNotification(data.message, 'success');
                
            } catch (error) {
                showNotification('Failed to remove user', 'error');
            }
            resolve(true);
        };
        
        document.querySelector('#confirmationModal .close').onclick = () => {
            modal.style.display = 'none';
            resolve(false);
        };
        
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
                resolve(false);
            }
        };
    });
}

function closeConfirmationModal() {
    document.getElementById('confirmationModal').style.display = 'none';
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = document.createElement('i');
    icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    
    const messageText = document.createElement('span');
    messageText.textContent = message;
    
    notification.appendChild(icon);
    notification.appendChild(messageText);
    
    // Create container if it doesn't exist
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}


let hasUnsavedChanges = false;

document.querySelector('.realm-title h1').addEventListener('input', () => {
    hasUnsavedChanges = true;
    document.getElementById('saveRealmChanges').classList.add('unsaved');
});

document.querySelector('.realm-description').addEventListener('input', () => {
    hasUnsavedChanges = true;
    document.getElementById('saveRealmChanges').classList.add('unsaved');
});

document.getElementById('saveRealmChanges').addEventListener('click', async () => {
    if (!hasUnsavedChanges) return;

    const realmData = {

        description: document.querySelector('.realm-description').textContent.trim(),
        realm_id: '{{ realm.uid }}'
    };

    try {
        const response = await fetch('/realms/${realmId}/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token
            },
            body: JSON.stringify(realmData)
        });
        
        if (response.ok) {
            hasUnsavedChanges = false;
            document.getElementById('saveRealmChanges').classList.remove('unsaved');
            const saveBtn = document.getElementById('saveRealmChanges');
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved';
            
            const notification = document.createElement('div');
            notification.className = 'notification success';
            notification.innerHTML = '<i class="fas fa-check-circle"></i> Realm updated successfully!';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
                notification.remove();
            }, 2000);
        }else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed to update realm';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
});