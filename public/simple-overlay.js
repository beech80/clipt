/**
 * Ultra Simple Overlay Creator
 * Enterprise-grade approach for production-scale environments
 */

document.addEventListener('DOMContentLoaded', function() {
  // Create top overlay - covers message area
  var overlay = document.createElement('div');
  overlay.className = 'top-overlay';
  document.body.appendChild(overlay);
  
  // Simple function to hide messages using display:none
  function hideMessages() {
    // Select using simple class names that won't cause errors
    var selectors = ['.text-purple-300', '.cyber-text'];
    
    selectors.forEach(function(selector) {
      var elements = document.querySelectorAll(selector);
      for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = 'none';
      }
    });
  }
  
  // Run multiple times to ensure it catches dynamically added elements
  hideMessages();
  setTimeout(hideMessages, 500);
  setTimeout(hideMessages, 1000);
});
