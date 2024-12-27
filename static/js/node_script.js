let hasUnsavedChanges = false;
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    const permissionsModal = document.getElementById('permissionsModal');
    const permissionsBtn = document.querySelector('button i.fa-users').parentElement;
    const linksBtn = document.querySelector('button i.fa-link').parentElement;
    const closeBtn = document.querySelector('#permissionsModal .close');
    // const token = "{{ csrf_token() }}";
    
    editableElements.forEach(element => {
        element.addEventListener('input', () => {
            hasUnsavedChanges = true;
            document.getElementById('saveChanges').classList.add('unsaved');
        });
    });   

    // Permissions Modal Handlers
    permissionsBtn.addEventListener('click', () => {
        permissionsModal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        permissionsModal.style.display = 'none';
    });

    window.onclick = function(event) {
        if (event.target == permissionsModal) {
            permissionsModal.style.display = 'none';
        }
    };

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
