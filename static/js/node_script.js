let hasUnsavedChanges = false;
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    const accessModal = document.getElementById('accessModal');
    const permissionsBtn = document.querySelector('.permissionsBtn');
    const closeAccessModal = () => {
        accessModal.style.display = 'none';
    };

    // const token = "{{ csrf_token() }}";
    
    editableElements.forEach(element => {
        element.addEventListener('input', () => {
            hasUnsavedChanges = true;
            document.getElementById('saveChanges').classList.add('unsaved');
        });
    });   

    // Permissions Modal Handlers
    permissionsBtn.addEventListener('click', () => {
        accessModal.style.display = 'block';
    });

    window.onclick = function(event) {
        if (event.target == accessModal) {
            accessModal.style.display = 'none';
        }
    };

    document.getElementById('saveChanges').addEventListener('click', async () => {
        const nodeName = document.querySelector('h1[contenteditable]').textContent;
        const nodeDescription = document.querySelector('.editable-description').textContent;
        const nodeId = document.getElementById('nodeId').value;
        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    
        try {
            const response = await fetch('/node/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token
                },
                body: JSON.stringify({
                    node_id: nodeId,
                    name: nodeName,
                    description: nodeDescription
                })
            });
    
            if (response.ok) {
                hasUnsavedChanges = false;
                document.getElementById('saveChanges').classList.remove('unsaved');
                const saveBtn = document.getElementById('saveChanges');
                saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved';
                
                const notification = document.createElement('div');
                notification.className = 'notification success';
                notification.innerHTML = '<i class="fas fa-check-circle"></i> Node updated successfully!';
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
                    notification.remove();
                }, 2000);
            }else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            const notification = document.createElement('div');
            notification.className = 'notification error';
            notification.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed to update node';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 2000);
        }
    });
    

    // Handle adding users
    document.querySelectorAll('.add-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const role = btn.dataset.role;
            const input = btn.parentElement.querySelector('input');
            const email = input.value.trim();
            
            if (!email) return;

            try {
                const response = await fetch('/node/permissions/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        node_id: '{{ node.uuid }}',
                        email: email,
                        role: role
                    })
                });

                if (response.ok) {
                    const userList = document.getElementById(`${role}sList`);
                    const userItem = document.createElement('div');
                    userItem.className = 'user-item';
                    userItem.innerHTML = `
                        <span>${email}</span>
                        <button class="remove-user" data-user="${email}" data-role="${role}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    userList.appendChild(userItem);
                    input.value = '';
                }
            } catch (error) {
                console.error('Error adding user:', error);
            }
        });
    });

    // Handle removing users
    document.querySelectorAll('.remove-user').forEach(btn => {
        btn.addEventListener('click', async () => {
            const user = btn.dataset.user;
            const role = btn.dataset.role;

            try {
                const response = await fetch('/node/permissions/remove', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        node_id: '{{ node.uuid }}',
                        email: user,
                        role: role
                    })
                });

                if (response.ok) {
                    btn.parentElement.remove();
                }
            } catch (error) {
                console.error('Error removing user:', error);
            }
        });
    });

    