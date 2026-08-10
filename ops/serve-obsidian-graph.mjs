import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const vaultPath = path.resolve(process.cwd(), '../HigherBits.dev Second Brain');
const PORT = 3040;

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f.startsWith('.') || f === 'node_modules') continue;
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (f.endsWith('.md')) {
      callback(dirPath);
    }
  }
}

function buildGraph() {
  const nodes = [];
  const links = [];
  const nodeSet = new Set();
  
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault path not found: ${vaultPath}`);
    return { nodes, links };
  }

  walkDir(vaultPath, (filePath) => {
    const filename = path.basename(filePath, '.md');
    nodeSet.add(filename);
    
    const content = fs.readFileSync(filePath, 'utf-8');
    // Match [[Link]] or [[Link|Alias]]
    const regex = /\[\[([^\]|]+)(?:\|.*?)?\]\]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const target = match[1].trim();
      links.push({ source: filename, target: target });
      nodeSet.add(target);
    }
  });

  nodes.push(...Array.from(nodeSet).map(id => ({ id, name: id })));
  return { nodes, links };
}

const server = http.createServer((req, res) => {
  if (req.url === '/graph-data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(buildGraph()));
    return;
  }
  
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Second Brain Graph</title>
  <style> 
    body { margin: 0; background: #09090b; color: #fff; font-family: system-ui, sans-serif; overflow: hidden; } 
    #info { position: absolute; top: 16px; left: 16px; font-weight: 500; font-size: 14px; color: rgba(255,255,255,0.7); z-index: 10; pointer-events: none;}
    #graph-container { width: 100vw; height: 100vh; position: relative; }
    
    /* Toggle Button */
    #sidebar-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 30;
      background: #222;
      border: 1px solid #333;
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    #sidebar-toggle:hover { background: #333; }
    
    #sidebar {
      position: absolute;
      top: 0;
      right: 0;
      width: 320px;
      max-width: 90vw;
      height: 100vh;
      background: rgba(17, 17, 17, 0.95);
      backdrop-filter: blur(8px);
      border-left: 1px solid #222;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      z-index: 20;
      transform: translateX(0);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: -4px 0 24px rgba(0,0,0,0.5);
    }
    #sidebar.hidden {
      transform: translateX(100%);
    }
    .sidebar-header {
      padding: 16px;
      padding-top: 60px; /* space for toggle button */
      border-bottom: 1px solid #222;
    }
    .search-box {
      width: 100%;
      padding: 8px 12px;
      background: #222;
      border: 1px solid #333;
      color: #fff;
      border-radius: 6px;
      box-sizing: border-box;
      outline: none;
    }
    .search-box:focus {
      border-color: #555;
    }
    #node-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .node-item {
      padding: 8px 12px;
      margin-bottom: 2px;
      border-radius: 6px;
      font-size: 13px;
      color: #999;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .node-item:hover {
      background: #222;
      color: #fff;
    }
    /* Scrollbar */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #555; }
  </style>
  <script src="https://unpkg.com/force-graph"></script>
</head>
<body>
  <div id="graph-container">
    <div id="info">HigherBits.dev Second Brain</div>
    <div id="graph"></div>
  </div>
  
  <button id="sidebar-toggle">Hide List</button>
  
  <div id="sidebar">
    <div class="sidebar-header">
      <input type="text" id="search" class="search-box" placeholder="Search nodes...">
    </div>
    <div id="node-list"></div>
  </div>
  <script>
    fetch('/graph-data').then(r => r.json()).then(data => {
      const Graph = ForceGraph()(document.getElementById('graph'))
        .graphData(data)
        .nodeLabel('name')
        .nodeAutoColorBy('id')
        .linkDirectionalArrowLength(3.5)
        .linkDirectionalArrowRelPos(1)
        .linkColor(() => 'rgba(255,255,255,0.15)')
        .backgroundColor('#09090b')
        .nodeRelSize(5);

      // Add simple hover effect
      Graph.onNodeHover(node => {
        document.getElementById('graph-container').style.cursor = node ? 'pointer' : null;
      });
      
      // Allow dragging
      Graph.d3Force('charge').strength(-150);
      
      // Handle resize explicitly just in case
      window.addEventListener('resize', () => {
        Graph.width(window.innerWidth).height(window.innerHeight);
      });

      // Render Sidebar
      const nodeListEl = document.getElementById('node-list');
      const searchInput = document.getElementById('search');
      
      const renderList = (filter = "") => {
        nodeListEl.innerHTML = "";
        const sortedNodes = [...data.nodes].sort((a,b) => a.name.localeCompare(b.name));
        for (const node of sortedNodes) {
          if (filter && !node.name.toLowerCase().includes(filter.toLowerCase())) continue;
          
          const el = document.createElement('div');
          el.className = 'node-item';
          el.innerText = node.name;
          
          el.onclick = () => {
             Graph.centerAt(node.x, node.y, 1000);
             Graph.zoom(8, 2000);
             // On mobile, auto-hide sidebar after clicking
             if (window.innerWidth < 600) {
               document.getElementById('sidebar').classList.add('hidden');
               document.getElementById('sidebar-toggle').innerText = 'Show List';
             }
          };
          nodeListEl.appendChild(el);
        }
      };
      
      renderList();
      
      searchInput.addEventListener('input', (e) => {
        renderList(e.target.value);
      });
      
      // Toggle logic
      const sidebar = document.getElementById('sidebar');
      const toggleBtn = document.getElementById('sidebar-toggle');
      toggleBtn.onclick = () => {
        const isHidden = sidebar.classList.toggle('hidden');
        toggleBtn.innerText = isHidden ? 'Show List' : 'Hide List';
      };
      
      // Auto hide on very small screens initially
      if (window.innerWidth < 600) {
        sidebar.classList.add('hidden');
        toggleBtn.innerText = 'Show List';
      }
    });
  </script>
</body>
</html>
    `);
    return;
  }
  
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Obsidian Graph Viewer running at http://localhost:${PORT}`);
});
