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

const filterHandlers = {
    '#annotations': 'lore',
    '#persons': 'person',
    '#artifacts': 'item',
    '#locations': 'place'
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

const menuToggle = document.querySelector('.menu-toggle');
const sideMenu = document.querySelector('.side-menu');
const mainContent = document.querySelector('.main-content');

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
