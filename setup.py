import tkinter as tk
from tkinter import filedialog, messagebox
import os
import sys
import threading
import urllib.request
import zipfile
import subprocess
import shutil

def resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

def create_setup():
    def browse_folder():
        folder_selected = filedialog.askdirectory()
        if folder_selected:
            folder_var.set(folder_selected)

    def download_and_extract(url, extract_to, progress_var, label_var, desc):
        label_var.set(f"Downloading {desc}...")

        def reporthook(count, block_size, total_size):
            if total_size > 0:
                percent = int(count * block_size * 100 / total_size)
                progress_var.set(min(percent, 100))
                root.update_idletasks()

        zip_path = os.path.join(extract_to, "temp.zip")
        urllib.request.urlretrieve(url, zip_path, reporthook)

        label_var.set(f"Extracting {desc}...")
        progress_var.set(0)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
        os.remove(zip_path)

    def install_thread():
        folder = folder_var.get()
        frontend_port = frontend_port_var.get()
        backend_port = backend_port_var.get()
        startup = startup_var.get()

        if not folder:
            messagebox.showerror("Error", "Please select an installation folder")
            btn_install.config(state=tk.NORMAL)
            return

        btn_install.config(state=tk.DISABLED)

        try:
            os.makedirs(folder, exist_ok=True)

            bundled_frontend = resource_path("frontend")
            bundled_backend  = resource_path("backend")
            dest_frontend    = os.path.join(folder, "frontend")
            dest_backend     = os.path.join(folder, "backend")

            status_var.set("Extracting Conduit files...")
            if os.path.exists(dest_frontend): shutil.rmtree(dest_frontend)
            if os.path.exists(dest_backend):  shutil.rmtree(dest_backend)

            if os.path.exists(bundled_frontend):
                shutil.copytree(bundled_frontend, dest_frontend)
            else:
                os.makedirs(dest_frontend, exist_ok=True)

            if os.path.exists(bundled_backend):
                shutil.copytree(bundled_backend, dest_backend)
            else:
                os.makedirs(dest_backend, exist_ok=True)

            # ── Java ────────────────────────────────────────────────────────────
            status_var.set("Checking for Java 21...")
            java_exe      = "java"
            java_bin_dir  = ""          # directory that contains java.exe
            try:
                subprocess.run(["java", "-version"], check=True,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            except (subprocess.CalledProcessError, FileNotFoundError):
                java_url = (
                    "https://github.com/adoptium/temurin21-binaries/releases/download/"
                    "jdk-21.0.6%2B7/OpenJDK21U-jre_x64_windows_hotspot_21.0.6_7.zip"
                )
                java_dir = os.path.join(folder, "java")
                os.makedirs(java_dir, exist_ok=True)
                download_and_extract(java_url, java_dir, progress_var, status_var, "Java 21")
                for root_dir, dirs, files in os.walk(java_dir):
                    if "java.exe" in files:
                        java_exe     = os.path.join(root_dir, "java.exe")
                        java_bin_dir = root_dir
                        break

            # ── Node.js ─────────────────────────────────────────────────────────
            status_var.set("Checking for Node.js 20...")
            node_exe      = "node"
            npm_cmd       = "npm.cmd"
            node_bin_dir  = ""          # directory that contains node.exe / npm.cmd
            try:
                subprocess.run(["node", "-v"], check=True,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            except (subprocess.CalledProcessError, FileNotFoundError):
                node_url = "https://nodejs.org/dist/v20.12.2/node-v20.12.2-win-x64.zip"
                node_dir = os.path.join(folder, "node")
                os.makedirs(node_dir, exist_ok=True)
                download_and_extract(node_url, node_dir, progress_var, status_var, "Node.js 20")
                for root_dir, dirs, files in os.walk(node_dir):
                    if "node.exe" in files:
                        node_exe     = os.path.join(root_dir, "node.exe")
                        node_bin_dir = root_dir
                    if "npm.cmd" in files:
                        npm_cmd = os.path.join(root_dir, "npm.cmd")

            # ── npm install (skip if node_modules already bundled) ──────────────
            status_var.set("Checking node_modules...")
            progress_var.set(50)
            env = os.environ.copy()
            extra_paths = []
            if node_bin_dir: extra_paths.append(node_bin_dir)
            if java_bin_dir: extra_paths.append(java_bin_dir)
            if extra_paths:
                env["PATH"] = os.pathsep.join(extra_paths) + os.pathsep + env["PATH"]

            node_modules_path = os.path.join(dest_frontend, "node_modules")
            if os.path.exists(node_modules_path):
                # node_modules already bundled in installer — skip npm install entirely
                status_var.set("node_modules already present, skipping install...")
            else:
                # Fallback: run npm install if node_modules not bundled
                status_var.set("Installing Node.js modules (this may take a few minutes)...")
                try:
                    subprocess.run(
                        [npm_cmd, "install", "--omit=dev", "--prefer-offline"],
                        cwd=dest_frontend, check=True,
                        shell=True, env=env
                    )
                except Exception as e:
                    raise Exception(f"Failed to install node modules: {e}")

            # ── Patch hardcoded backend port ─────────────────────────────────────
            status_var.set("Configuring dynamic ports...")
            progress_var.set(75)
            next_dir = os.path.join(dest_frontend, ".next")
            if os.path.exists(next_dir):
                for root_dir, dirs, files in os.walk(next_dir):
                    dirs[:] = [d for d in dirs if d != "cache"]
                    for file in files:
                        if file.endswith((".json", ".js", ".html", ".txt")):
                            filepath = os.path.join(root_dir, file)
                            try:
                                with open(filepath, "r", encoding="utf-8") as f:
                                    content = f.read()
                                if "http://127.0.0.1:8080" in content:
                                    content = content.replace(
                                        "http://127.0.0.1:8080",
                                        f"http://127.0.0.1:{backend_port}"
                                    )
                                    with open(filepath, "w", encoding="utf-8") as f:
                                        f.write(content)
                            except Exception:
                                pass

            # ── Build C# launcher ────────────────────────────────────────────────
            status_var.set("Creating startup scripts...")
            progress_var.set(90)

            jar_file = "app.jar"
            if os.path.exists(dest_backend):
                for f in os.listdir(dest_backend):
                    if f.endswith(".jar"):
                        jar_file = f
                        break

            cs_path      = os.path.join(folder, "Launcher.cs")
            launcher_exe = os.path.join(folder, "ConduitServer.exe")
            icon_path    = os.path.join(dest_frontend, "public", "logo.ico")

            # Escape backslashes for C# string literals
            def cs(p): return p.replace("\\", "\\\\")

            # Decide what PATH entries the C# app should prepend
            cs_extra_paths = []
            if node_bin_dir: cs_extra_paths.append(cs(node_bin_dir))
            if java_bin_dir: cs_extra_paths.append(cs(java_bin_dir))
            cs_path_prepend = ";".join(cs_extra_paths)   # C# will prepend this

            cs_java_exe      = cs(java_exe)
            cs_jar_path      = cs(os.path.join(dest_backend, jar_file))
            cs_npm_cmd       = cs(npm_cmd)
            cs_dest_frontend = cs(dest_frontend)
            cs_icon_path     = cs(icon_path)

            with open(cs_path, "w", encoding="utf-8") as f:
                f.write(f'''using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using System.Drawing;
using System.IO;
using System.Threading;

namespace Conduit
{{
    class LogWindow : Form
    {{
        public RichTextBox BackendLog;
        public RichTextBox FrontendLog;

        public LogWindow()
        {{
            this.Text = "Conduit Server Logs";
            this.Size = new System.Drawing.Size(900, 650);
            this.StartPosition = FormStartPosition.CenterScreen;

            TabControl tabs = new TabControl {{ Dock = DockStyle.Fill }};

            TabPage page1 = new TabPage("Backend");
            BackendLog = new RichTextBox
            {{
                Dock = DockStyle.Fill, ReadOnly = true,
                BackColor = Color.Black, ForeColor = Color.LightGreen,
                Font = new Font("Consolas", 9), ScrollBars = RichTextBoxScrollBars.Vertical
            }};
            page1.Controls.Add(BackendLog);

            TabPage page2 = new TabPage("Frontend");
            FrontendLog = new RichTextBox
            {{
                Dock = DockStyle.Fill, ReadOnly = true,
                BackColor = Color.Black, ForeColor = Color.Cyan,
                Font = new Font("Consolas", 9), ScrollBars = RichTextBoxScrollBars.Vertical
            }};
            page2.Controls.Add(FrontendLog);

            tabs.TabPages.Add(page1);
            tabs.TabPages.Add(page2);
            this.Controls.Add(tabs);

            // Hide instead of close so logs are preserved
            this.FormClosing += (s, e) => {{ this.Hide(); e.Cancel = true; }};
        }}

        private void AppendTo(RichTextBox box, string text)
        {{
            if (string.IsNullOrEmpty(text)) return;
            if (box.InvokeRequired)
            {{
                try {{ box.BeginInvoke(new Action<RichTextBox, string>(AppendTo), box, text); }} catch {{ }}
                return;
            }}
            box.AppendText(text + Environment.NewLine);
            // Trim if too long
            if (box.TextLength > 120000)
                box.Text = box.Text.Substring(30000);
            box.SelectionStart = box.Text.Length;
            box.ScrollToCaret();
        }}

        public void AppendBackend(string text)  {{ AppendTo(BackendLog,  text); }}
        public void AppendFrontend(string text) {{ AppendTo(FrontendLog, text); }}
    }}

    class Program
    {{
        [DllImport("kernel32.dll")] static extern IntPtr CreateJobObject(IntPtr a, string b);
        [DllImport("kernel32.dll")] static extern bool SetInformationJobObject(IntPtr hJob, int cls, IntPtr ptr, int len);
        [DllImport("kernel32.dll")] static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);

        [StructLayout(LayoutKind.Sequential)]
        struct JOBOBJECT_BASIC_LIMIT_INFORMATION
        {{
            public long PerProcessUserTimeLimit, PerJobUserTimeLimit;
            public uint LimitFlags;
            public UIntPtr MinimumWorkingSetSize, MaximumWorkingSetSize;
            public uint ActiveProcessLimit;
            public UIntPtr Affinity;
            public uint PriorityClass, SchedulingClass;
        }}
        [StructLayout(LayoutKind.Sequential)]
        struct IO_COUNTERS
        {{
            public ulong ReadOperationCount, WriteOperationCount, OtherOperationCount,
                         ReadTransferCount, WriteTransferCount, OtherTransferCount;
        }}
        [StructLayout(LayoutKind.Sequential)]
        struct JOBOBJECT_EXTENDED_LIMIT_INFORMATION
        {{
            public JOBOBJECT_BASIC_LIMIT_INFORMATION BasicLimitInformation;
            public IO_COUNTERS IoInfo;
            public UIntPtr ProcessMemoryLimit, JobMemoryLimit,
                           PeakProcessMemoryUsed, PeakJobMemoryUsed;
        }}

        static LogWindow logWin;

        static ProcessStartInfo MakeStartInfo(string exe, string args, string workDir = null)
        {{
            var psi = new ProcessStartInfo
            {{
                FileName               = exe,
                Arguments              = args,
                CreateNoWindow         = true,
                UseShellExecute        = false,
                RedirectStandardOutput = true,
                RedirectStandardError  = true,
            }};
            if (workDir != null) psi.WorkingDirectory = workDir;
            return psi;
        }}

        static NotifyIcon _tray;

        static void DoExit()
        {{
            // Hide tray icon immediately so it doesn't ghost
            if (_tray != null)
            {{
                _tray.Visible = false;
                _tray.Dispose();
                _tray = null;
            }}
            // Kill all child processes via job object — they die when this process exits
            Application.Exit();
            Environment.Exit(0);
        }}

        [STAThread]
        static void Main(string[] args)
        {{
            // ── single instance guard ────────────────────────────────────────
            bool createdNew;
            Mutex mutex = new Mutex(true, "ConduitServerSingleInstance", out createdNew);
            if (!createdNew)
            {{
                MessageBox.Show(
                    "Conduit Server is already running." + Environment.NewLine + "Check the system tray.",
                    "Already Running",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
                return;
            }}

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            logWin = new LogWindow();

            // ── environment ──────────────────────────────────────────────────
            Environment.SetEnvironmentVariable("PORT", "{frontend_port}");
            Environment.SetEnvironmentVariable("NEXT_PUBLIC_API_URL", "http://127.0.0.1:{backend_port}");

            string extraPaths = @"{cs_path_prepend}";
            if (!string.IsNullOrEmpty(extraPaths))
            {{
                string curPath = Environment.GetEnvironmentVariable("PATH") ?? "";
                Environment.SetEnvironmentVariable("PATH", extraPaths + ";" + curPath);
            }}

            // ── job object (kill children when this process exits) ────────────
            IntPtr job = CreateJobObject(IntPtr.Zero, null);
            var jeli = new JOBOBJECT_EXTENDED_LIMIT_INFORMATION();
            jeli.BasicLimitInformation.LimitFlags = 0x2000;
            int sz = Marshal.SizeOf(typeof(JOBOBJECT_EXTENDED_LIMIT_INFORMATION));
            IntPtr ptr = Marshal.AllocHGlobal(sz);
            Marshal.StructureToPtr(jeli, ptr, false);
            SetInformationJobObject(job, 9, ptr, sz);

            // ── tray icon (create BEFORE background thread so it exists on UI thread) ──
            _tray = new NotifyIcon();
            _tray.Text = "Conduit Server";
            try   {{ _tray.Icon = new Icon(@"{cs_icon_path}"); }}
            catch {{ _tray.Icon = SystemIcons.Application; }}
            _tray.Visible = true;

            ContextMenuStrip menu = new ContextMenuStrip();
            menu.Items.Add("Open Conduit", null, (s, e) => Process.Start("http://127.0.0.1:{frontend_port}"));
            menu.Items.Add("View Logs",    null, (s, e) => {{ logWin.Show(); logWin.BringToFront(); }});
            menu.Items.Add("Exit Server",  null, (s, e) => DoExit());
            _tray.ContextMenuStrip = menu;
            _tray.DoubleClick += (s, e) => Process.Start("http://127.0.0.1:{frontend_port}");

            // Show log window so user sees startup progress
            logWin.Show();

            // ── launch processes on background thread so UI stays responsive ──
            new Thread((ThreadStart)delegate
            {{
                // Launch backend
                logWin.AppendBackend(">>> Starting backend...");
                try
                {{
                    var psi = MakeStartInfo(
                        @"{cs_java_exe}",
                        @"-Dserver.port={backend_port} -jar ""{cs_jar_path}"""
                    );
                    Process backend = new Process();
                    backend.StartInfo = psi;
                    backend.OutputDataReceived += (s, e) => logWin.AppendBackend(e.Data);
                    backend.ErrorDataReceived  += (s, e) => logWin.AppendBackend(e.Data);
                    backend.Start();
                    backend.BeginOutputReadLine();
                    backend.BeginErrorReadLine();
                    AssignProcessToJobObject(job, backend.Handle);
                    logWin.AppendBackend(">>> Backend PID: " + backend.Id);
                }}
                catch (Exception ex)
                {{
                    logWin.AppendBackend(">>> Backend ERROR: " + ex.Message);
                }}

                // Wait for backend to be ready
                logWin.AppendFrontend(">>> Waiting 3s for backend...");
                Thread.Sleep(3000);

                // Launch frontend
                logWin.AppendFrontend(">>> Starting frontend...");
                try
                {{
                    string npmArg = "/c " + (char)34 + @"{cs_npm_cmd}" + (char)34 + " start";
                    var psi = MakeStartInfo("cmd.exe", npmArg, @"{cs_dest_frontend}");
                    Process frontend = new Process();
                    frontend.StartInfo = psi;
                    frontend.OutputDataReceived += (s, e) => logWin.AppendFrontend(e.Data);
                    frontend.ErrorDataReceived  += (s, e) => logWin.AppendFrontend(e.Data);
                    frontend.Start();
                    frontend.BeginOutputReadLine();
                    frontend.BeginErrorReadLine();
                    AssignProcessToJobObject(job, frontend.Handle);
                    logWin.AppendFrontend(">>> Frontend PID: " + frontend.Id);
                }}
                catch (Exception ex)
                {{
                    logWin.AppendFrontend(">>> Frontend ERROR: " + ex.Message);
                }}

                // Open browser after frontend has had time to start
                Thread.Sleep(6000);
                try {{ Process.Start("http://127.0.0.1:{frontend_port}"); }} catch {{ }}

            }}) {{ IsBackground = true }}.Start();

            Application.Run();
        }}
    }}
}}
''')

            # ── Compile C# ───────────────────────────────────────────────────────
            status_var.set("Compiling native launcher...")
            csc_path = r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
            icon_arg = f"/win32icon:{icon_path}" if os.path.exists(icon_path) else ""
            cmd = [csc_path, "/nologo", "/target:winexe",
                   "/reference:System.Windows.Forms.dll",
                   "/reference:System.Drawing.dll"]
            if icon_arg: cmd.append(icon_arg)
            cmd += [f"/out:{launcher_exe}", cs_path]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"C# compile failed:\n{result.stdout}\n{result.stderr}")
            os.remove(cs_path)

            # ── Shortcuts ────────────────────────────────────────────────────────
            desktop_dir    = os.path.join(os.environ["USERPROFILE"], "Desktop")
            startup_dir    = os.path.join(os.environ["APPDATA"], "Microsoft", "Windows", "Start Menu", "Programs", "Startup")
            # Named subfolder = appears as its own group in Start Menu (like WhatsApp, VS Code)
            start_menu_dir = os.path.join(os.environ["APPDATA"], "Microsoft", "Windows", "Start Menu", "Programs", "Conduit")
            os.makedirs(start_menu_dir, exist_ok=True)

            desktop_shortcut    = os.path.join(desktop_dir,    "Conduit.lnk")
            start_menu_shortcut = os.path.join(start_menu_dir, "Conduit.lnk")

            # Use .ico if it exists, otherwise fall back to the exe itself (which has embedded icon)
            icon_location = icon_path if os.path.exists(icon_path) else launcher_exe

            vbs_path = os.path.join(folder, "create_shortcuts.vbs")
            with open(vbs_path, "w") as f:
                f.write(f'''Set oWS = WScript.CreateObject("WScript.Shell")

' Desktop shortcut
Set oLink = oWS.CreateShortcut("{desktop_shortcut}")
oLink.TargetPath = "{launcher_exe}"
oLink.WorkingDirectory = "{folder}"
oLink.Description = "Conduit Application Server"
oLink.IconLocation = "{icon_location}, 0"
oLink.WindowStyle = 1
oLink.Save

' Start Menu shortcut (Conduit subfolder)
Set oLinkSM = oWS.CreateShortcut("{start_menu_shortcut}")
oLinkSM.TargetPath = "{launcher_exe}"
oLinkSM.WorkingDirectory = "{folder}"
oLinkSM.Description = "Conduit Application Server"
oLinkSM.IconLocation = "{icon_location}, 0"
oLinkSM.WindowStyle = 1
oLinkSM.Save
''')
                if startup:
                    startup_shortcut = os.path.join(startup_dir, "Conduit.lnk")
                    f.write(f'''
' Startup shortcut
Set oLink2 = oWS.CreateShortcut("{startup_shortcut}")
oLink2.TargetPath = "{launcher_exe}"
oLink2.WorkingDirectory = "{folder}"
oLink2.Description = "Conduit Application Server"
oLink2.IconLocation = "{icon_location}, 0"
oLink2.WindowStyle = 1
oLink2.Save
''')
            subprocess.run(["cscript", "//nologo", vbs_path], check=True)
            os.remove(vbs_path)

            progress_var.set(100)
            status_var.set("Installation Complete!")
            messagebox.showinfo(
                "Success",
                f"Conduit installed successfully!\n\n"
                f"Location: {folder}\n"
                f"Backend Port: {backend_port}\n"
                f"Frontend Port: {frontend_port}\n\n"
                f"The log window opens automatically on launch."
            )
            root.destroy()

        except Exception as e:
            messagebox.showerror("Error", f"Installation failed:\n{e}")
            btn_install.config(state=tk.NORMAL)

    def install():
        threading.Thread(target=install_thread, daemon=True).start()

    # ── UI ───────────────────────────────────────────────────────────────────────
    root = tk.Tk()
    root.title("Conduit Windows Installer")
    root.geometry("460x420")
    root.resizable(False, False)

    try:
        from tkinter import ttk
        ttk.Style().theme_use('clam')
    except Exception:
        pass

    tk.Label(root, text="Conduit Offline Setup", font=("Helvetica", 16, "bold")).pack(pady=15)

    folder_var       = tk.StringVar(value=os.path.join(os.path.expanduser("~"), "ConduitApp"))
    frontend_port_var = tk.StringVar(value="3000")
    backend_port_var  = tk.StringVar(value="8080")
    startup_var       = tk.BooleanVar(value=True)
    status_var        = tk.StringVar(value="Ready to install.")
    progress_var      = tk.IntVar(value=0)

    tk.Label(root, text="Installation Folder:").pack(pady=(5, 0))
    frame1 = tk.Frame(root)
    frame1.pack()
    tk.Entry(frame1, textvariable=folder_var, width=40).pack(side=tk.LEFT, padx=5)
    tk.Button(frame1, text="Browse...", command=browse_folder).pack(side=tk.LEFT)

    tk.Label(root, text="Frontend Port (Default 3000):").pack(pady=(15, 0))
    tk.Entry(root, textvariable=frontend_port_var, width=15).pack()

    tk.Label(root, text="Backend Port (Default 8080):").pack(pady=(10, 0))
    tk.Entry(root, textvariable=backend_port_var, width=15).pack()

    tk.Checkbutton(root, text="Start automatically on PC boot", variable=startup_var).pack(pady=(15, 5))

    tk.Label(root, textvariable=status_var, fg="blue").pack(pady=(5, 0))

    from tkinter import ttk
    progress = ttk.Progressbar(root, variable=progress_var, maximum=100, length=320)
    progress.pack(pady=5)

    btn_install = tk.Button(
        root, text="Install App", command=install,
        bg="#4CAF50", fg="white",
        font=("Helvetica", 10, "bold"), width=20, height=2
    )
    btn_install.pack(pady=10)

    root.mainloop()

if __name__ == "__main__":
    create_setup()