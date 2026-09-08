# ClearCut - AI Image Background Removal Web Application

ClearCut is an AI-powered image background removal web application built with native PHP 8+, PHP cURL, HTML5, Vanilla CSS, and Vanilla JavaScript. It uses the official **Pixelcut Background Removal API** to isolate subjects and produce high-resolution transparent PNG images in seconds.

Designed specifically as a clean, student-friendly project, ClearCut requires **no database**, **no external dependencies**, **no Composer**, and **no frontend or backend frameworks**.

---

## Features

- **Multilingual Support (3 Languages)**: Instant, seamless language switching between **English (🇺🇸)**, **Chinese (🇨🇳 简体中文)**, and **Malay (🇲🇾 Bahasa Melayu)** across all UI elements, processing stages, and the user manual, with 30-day cookie persistence.
- **Integrated Image Studio (Shapes, Resizing, Vignette, Filters & Text)**: Client-side HTML5 Canvas editor built directly into the web application:
  - **Freeform Chop & Shape Chopper ("Chop Free")**: Crop to standard aspect ratios (1:1, 4:3, 16:9, 3:4, 9:16), cut off custom border margins with Freeform % sliders, or mask photos into creative shapes (Circle / Oval, Rounded Box, Heart Shape, Star Badge) with clean transparent boundaries.
  - **Resize Picture Dimensions**: Scale images to exact Width and Height (in pixels) with automatic aspect ratio locking, or use quick presets (25%, 50%, 75%, 100%, 150%, 200%).
  - **Turn & Orientation**: Rotate 90° clockwise/counter-clockwise, flip horizontally, and flip vertically.
  - **Aesthetic Filters, Sliders & Vignette**: 8 color filter presets (Normal, Vivid, B&W, Sepia, Vintage, Warm, Cool, High Contrast, Vignette) plus continuous sliders for Brightness, Contrast, Saturation, and Vignette edge shading.
  - **Text Overlay (Add Words)**: Type custom text and captions onto the image with 5 font styles (Modern Sans, Classic Serif, Bold Impact, Handwriting Script, Monospace), font size slider, color picker with quick swatches, bold/italic, outline shadow/glow, quick alignment, and interactive click-and-drag positioning on the canvas.
  - **Skip Background Removal (Direct Edit & Download)**: Allows users to edit and download original photos directly without calling the AI or consuming API credits ("Edit Photo (Skip AI)").
  - **Edit Cutout**: Post-process transparent background-removed images with full alpha-channel preservation.
- **One-Click AI Background Removal**: Uses Pixelcut's state-of-the-art machine learning models to remove complex backgrounds with clean hair, edge, and cutout detection.
- **Drag-and-Drop File Upload**: Smooth, responsive upload dropzone with click-to-browse file picker.
- **Local Pre-Upload Preview**: Instant thumbnail preview with file name and formatted file size.
- **Client & Server-Side Validation**: Validates file types (JPG, PNG, WEBP, GIF), MIME types, image dimensions, and enforces a 15 MB size limit.
- **Side-by-Side Comparison**: Responsive desktop side-by-side view and mobile stacked view comparing the original photo with the transparent cutout.
- **Transparency Checkerboard Preview**: Built-in CSS checkerboard background to visualize PNG alpha channel transparency.
- **One-Click Download**: Automatically downloads the processed cutout as `no-bg.png` (or edited PNGs).
- **Zero Framework Overhead**: Built with pure native PHP 8+, cURL, HTML5, Vanilla CSS, and Vanilla JS.
- **Production-Grade Security**: Server-side API key masking, randomized file naming, directory traversal prevention, and script execution prevention in upload directories.
- **Student-Friendly Architecture**: Modular, readable, and well-commented codebase.

---

## Technology Stack

- **Frontend**:
  - HTML5 (Semantic elements & accessibility attributes)
  - CSS3 (Vanilla CSS, custom dark mode, glassmorphism, responsive grid & flexbox)
  - JavaScript (Vanilla ES6+, fetch API, FormData, FileReader)
- **Backend**:
  - PHP 8+ (Native PHP)
  - PHP cURL (Server-to-server API communication with bundled CA certificate)
  - PHP Fileinfo & GD extensions (MIME type verification & image validation)
- **AI Engine**:
  - Pixelcut Background Removal API
- **Database**:
  - None required (Stateless file-based processing with automatic cleanup)

---

## Project Structure

```text
clearcut/
│
├── index.php                 # Main application page (Upload, preview & result)
├── manual.php                # User manual and documentation page (Multilingual)
├── config.php                # Central configuration (API keys, directories, limits)
├── README.md                 # Complete project documentation and setup guide
├── .htaccess                 # Apache security rules (Disable directory indexes)
│
├── api/
│   ├── process.php           # Image validation, Pixelcut API cURL call & result handling
│   └── download.php          # Secure download & image preview endpoint (no-bg.png)
│
├── assets/
│   ├── css/
│   │   ├── style.css         # Main application stylesheet (Dark theme, UI & language switcher)
│   │   └── manual.css        # User manual and documentation styles
│   │
│   └── js/
│       ├── app.js            # Main client-side logic (Upload, preview, AJAX, i18n status)
│       └── manual.js         # Interactive FAQ accordion & language dropdown logic
│
├── includes/
│   ├── languages.php         # Multilingual dictionary (English, Chinese, Malay) & switcher
│   ├── footer.php            # Shared reusable footer component
│   └── cacert.pem            # Bundled SSL CA bundle for Windows / XAMPP cURL
│
├── uploads/
│   └── .htaccess             # Security policy: Denies execution of PHP scripts
│
└── outputs/
    └── .htaccess             # Security policy: Protects generated PNG files
```

---

## Requirements

Before running ClearCut, ensure your environment meets the following requirements:

1. **PHP 8.0 or higher** (PHP 8.1, 8.2, 8.3, or 8.5 recommended).
2. **PHP cURL extension** enabled (`curl`).
3. **PHP Fileinfo extension** enabled (`fileinfo`).
4. **Active Internet Connection** (to communicate with Pixelcut cloud servers).
5. **Pixelcut API Key** (obtained from the Pixelcut Developer Portal).
6. **Modern Web Browser** (Chrome, Firefox, Safari, Edge).
7. **PHP-compatible Web Server** (Apache, Nginx, XAMPP, or PHP built-in CLI server).

---

## Pixelcut API

ClearCut connects directly to the official **Pixelcut Background Removal API**:

- **Official API Endpoint**:
  ```text
  https://api.developer.pixelcut.ai/v1/remove-background
  ```
- **Authentication Header**:
  ```text
  X-API-KEY: YOUR_PIXELCUT_API_KEY
  ```
- **Response Format**:
  ClearCut requests a JSON response with `Accept: application/json`, which returns a secure `result_url` pointing to the generated high-resolution transparent PNG.

> [!WARNING]
> **API Key Protection:**
> Never commit a real Pixelcut API key to a public GitHub repository or embed it into client-side JavaScript. ClearCut ensures the API key remains strictly on the server inside `config.php` or server environment variables.

---

## Getting a Pixelcut API Key

1. Visit the official Pixelcut developer portal: [https://developer.pixelcut.ai](https://developer.pixelcut.ai) or [https://pixelcut.ai](https://pixelcut.ai).
2. Sign up for a free developer account or log in.
3. Navigate to your **API Keys / Dashboard** section.
4. Generate a new API key.
5. Copy your API key (it typically looks like a secure alphanumeric token).

---

## Configuration

ClearCut provides two flexible ways to configure your Pixelcut API key:

### Method 1: In `config.php` (Simplest for Students)

Open `config.php` in a text editor and locate the `PIXELCUT_API_KEY` definition:

```php
// config.php
$envApiKey = getenv('PIXELCUT_API_KEY');
define('PIXELCUT_API_KEY', !empty($envApiKey) ? $envApiKey : 'YOUR_PIXELCUT_API_KEY_HERE');
```

Replace `'YOUR_PIXELCUT_API_KEY_HERE'` with your actual Pixelcut API key:

```php
define('PIXELCUT_API_KEY', 'sk_live_1234567890abcdef');
```

### Method 2: Environment Variable (Recommended for Production & GitHub)

Set the environment variable `PIXELCUT_API_KEY` in your web server environment, `.env` file, or shell:

```bash
# On Linux / macOS
export PIXELCUT_API_KEY="your_api_key_here"

# On Windows PowerShell
$env:PIXELCUT_API_KEY="your_api_key_here"
```

If the environment variable is present, ClearCut will automatically detect and prioritize it over the default constant.

---

## Local Installation

### Using PHP Built-in Server

1. **Clone or download** the project to your local computer:
   ```bash
   git clone https://github.com/your-username/clearcut.git
   cd clearcut
   ```
2. **Configure your API Key**:
   Edit `config.php` and insert your Pixelcut API key.
3. **Verify PHP and cURL**:
   ```bash
   php -m | findstr -i "curl fileinfo"
   ```
   *(On Linux/macOS, use `grep -iE "curl|fileinfo"`)*
4. **Start the local server**:
   ```bash
   php -S localhost:8000
   ```
5. **Open ClearCut**:
   Open your browser and visit:
   ```text
   http://localhost:8000
   ```

---

## XAMPP Setup (Windows / macOS / Linux)

1. **Open your XAMPP installation directory**:
   - Windows default: `C:\xampp\htdocs\` or `D:\xampp\htdocs\`
   - macOS default: `/Applications/XAMPP/xamppfiles/htdocs/`
   - Linux default: `/opt/lampp/htdocs/`
2. **Place the project files** into a subfolder named `clearcut`:
   ```text
   htdocs/clearcut/
   ```
   *(Or keep it inside your existing workspace folder)*
3. **Ensure Apache is running**:
   Open the **XAMPP Control Panel** and click **Start** next to Apache.
4. **Configure your API Key** in `config.php`.
5. **Access ClearCut in your browser**:
   ```text
   http://localhost/clearcut/
   ```

---

## Shared Hosting Deployment (cPanel / DirectAdmin / Plesk)

1. **Upload Project Files**:
   Upload the ClearCut folder contents to your hosting directory (usually `public_html/` or a subdomain folder like `public_html/clearcut/`) using FTP/SFTP or the cPanel File Manager.
2. **Check PHP Version**:
   In cPanel, open **Select PHP Version** or **MultiPHP Manager** and select **PHP 8.0 or higher** (PHP 8.1+ recommended).
3. **Enable PHP Extensions**:
   Ensure `curl` and `fileinfo` are ticked in your PHP Extensions list.
4. **Configure API Key**:
   Edit `config.php` directly through the hosting file manager or set an environment variable.
5. **Verify Folder Permissions**:
   Ensure the `uploads/` and `outputs/` directories have write permissions (`0755` or `0775`).
6. **Test the Workflow**:
   - Open your site: `https://yourdomain.com/clearcut/`
   - Upload an image.
   - Verify that background removal completes and downloads `no-bg.png`.

---

## Security Best Practices

ClearCut follows strict security practices:

- **Server-Side API Key**: The Pixelcut API key is never exposed to HTML, CSS, JavaScript, or network requests visible to the browser.
- **Randomized File Names**: All temporary files are renamed to cryptographically secure random names (e.g. `upload_8f3a9c2e...jpg` and `7c82f6e1...png`). Original client filenames are discarded.
- **MIME Type & Content Verification**: File extensions are not blindly trusted. Both `finfo_file` (MIME sniffing) and `getimagesize()` are executed to confirm genuine image data.
- **Directory Traversal Defense**: The download endpoint `api/download.php` uses strict 32-character hexadecimal pattern matching and canonical path verification (`realpath()`), strictly rejecting traversal attacks (`../../`).
- **Script Execution Prevention**: The `.htaccess` files inside `uploads/` and `outputs/` disable the PHP engine (`php_flag engine off`) and deny execution of PHP, CGI, Perl, and shell scripts.
- **Automatic Garbage Collection**: Temporary uploads and old output files are automatically cleaned up to prevent disk saturation.

---

## Normal User Workflow

1. User accesses the homepage.
2. User drags an image into the upload box or clicks **Choose Image**.
3. ClearCut immediately renders a client-side preview with file name and size.
4. User clicks **Remove Background**.
5. JavaScript sends the image to `api/process.php` via `FormData` and `fetch`.
6. PHP verifies the file and sends it to the Pixelcut AI API.
7. Pixelcut processes the image and returns a transparent PNG URL.
8. PHP downloads and validates the PNG, stores it in `outputs/`, and deletes the uploaded source file.
9. PHP returns a secure result token to JavaScript.
10. The browser displays the original image alongside the background-removed transparent PNG over a checkerboard background.
11. User clicks **Download PNG** to receive `no-bg.png`.
12. User clicks **Upload Another** to repeat the process with a new photo.

---

## Limitations

- **Internet Access Required**: Because image segmentation is processed by Pixelcut cloud neural networks, an active internet connection is mandatory.
- **API Credits**: Each background removal operation consumes credits according to your Pixelcut API plan.
- **File Size Limit**: Maximum uploaded image size is 15 MB.
- **Supported Formats**: Accepts JPG, JPEG, PNG, WEBP, and GIF images.

---

## Troubleshooting

### 1. Pixelcut API Does Not Work
- **Check API Key**: Verify that `config.php` has a valid key and does not still contain `'YOUR_PIXELCUT_API_KEY_HERE'`.
- **Check Credit Balance**: Log into your Pixelcut Developer dashboard to confirm your account has active credits.
- **Check Internet / Firewall**: Ensure your local machine or server can make outbound HTTPS requests to `https://api.developer.pixelcut.ai`.
- **Verify PHP cURL**: Run `php -m` in your terminal to ensure `curl` is listed.

### 2. Upload Fails
- **File Size Limit**: Confirm the image is under 15 MB. Check `upload_max_filesize` and `post_max_size` in your `php.ini` if testing files up to 15 MB.
- **Permissions**: Ensure PHP has write permissions to the `uploads/` directory (`chmod 755 uploads`).
- **File Format**: Verify your image is a valid JPG, PNG, WEBP, or GIF.

### 3. Download Fails
- **Permissions**: Ensure PHP has write permissions to the `outputs/` directory (`chmod 755 outputs`).
- **Invalid Result ID**: The download endpoint strictly requires a 32-character hexadecimal token. Ensure the session was not refreshed before downloading.

---

## License

This project is open-source and released under the **MIT License**.

```text
MIT License

Copyright (c) 2026 ClearCut Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
