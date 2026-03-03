javascript:(function() {
    fetch('https://raw.githubusercontent.com/TrulyZeph/Zephware/main/main.js').then(response => response.text()).then(scriptText => {
        eval(scriptText);
        console.log('Zephware Loaded!');
    }
    ).catch(err => console.error('Error loading script:', err));
}
)();