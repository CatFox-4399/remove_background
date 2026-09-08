<?php
/**
 * ClearCut - Shared Multilingual Footer Component
 */
?>
<footer class="site-footer">
    <div class="footer-container">
        <div class="footer-brand">
            <div class="footer-logo">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="6" cy="6" r="3"></circle>
                    <circle cx="6" cy="18" r="3"></circle>
                    <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                    <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                    <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                </svg>
                <span>ClearCut</span>
            </div>
            <p class="footer-desc"><?php echo htmlspecialchars(t('footer_desc')); ?></p>
        </div>

        <div class="footer-links">
            <div class="footer-col">
                <h4><?php echo htmlspecialchars(t('footer_nav')); ?></h4>
                <ul>
                    <li><a href="<?php echo htmlspecialchars(lang_url('index.php')); ?>"><?php echo htmlspecialchars(t('home')); ?></a></li>
                    <li><a href="<?php echo htmlspecialchars(lang_url('manual.php')); ?>"><?php echo htmlspecialchars(t('manual')); ?></a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h4><?php echo htmlspecialchars(t('footer_powered')); ?></h4>
                <ul>
                    <li><a href="https://pixelcut.ai" target="_blank" rel="noopener noreferrer">Pixelcut AI</a></li>
                    <li><a href="https://developer.pixelcut.ai" target="_blank" rel="noopener noreferrer">Pixelcut Developer API</a></li>
                </ul>
            </div>
        </div>
    </div>
    <div class="footer-bottom">
        <p>&copy; <?php echo date('Y'); ?> <?php echo htmlspecialchars(t('footer_copy')); ?></p>
    </div>
</footer>
