javascript:(function() {
    fetch('https://raw.githubusercontent.com/EternallyHyper/Hyperware/main/main.js').then(response => response.text()).then(scriptText => {
        eval(scriptText);
        console.log('Hyperware Loaded!');
    }
    ).catch(err => console.error('Error loading script:', err));
}
)();