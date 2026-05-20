/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Layers3, Save, RefreshCw, Pencil, ChevronRight } from 'lucide-react';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [selectedBlock, setSelectedBlock] = useState('grass');
  const [blockName, setBlockName] = useState('Grass Block');
  const [status, setStatus] = useState('Ready');
  const [showModal, setShowModal] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockColor, setNewBlockColor] = useState('#4ade80');
  const [blocks, setBlocks] = useState([
    { id: 'grass', name: 'Grass Block', color: '#4ade80' },
    { id: 'stone', name: 'Stone Block', color: '#78716c' }
  ]);

  const loadBlock = async (block: { id: string, name: string, color: string }) => {
    console.log('Loading block:', block);
    if (!sceneRef.current) return;
    setStatus('Loading...');
    
    // Proper disposal of old cubes
    const toRemove = sceneRef.current.children.filter(child => child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry);
    toRemove.forEach(child => {
        if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
            } else {
                child.material.dispose();
            }
            sceneRef.current?.remove(child);
        }
    });

    try {
      const data = block;
      setBlockName(data.name);

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial({ color: data.color });
      const cube = new THREE.Mesh(geometry, material);
      sceneRef.current.add(cube);
      setStatus('Ready');
      console.log('Successfully added block:', block.id);
    } catch (error) {
      console.error(`Failed to load block: ${block.id}`, error);
      setStatus('Error');
    }
  };

  const handleCreateBlock = () => {
    const id = newBlockName.toLowerCase().replace(/\s+/g, '_');
    const newBlock = { id, name: newBlockName, color: newBlockColor };
    setBlocks([...blocks, newBlock]);
    setShowModal(false);
    setNewBlockName('');
    setNewBlockColor('#4ade80');
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xebe9e1); 

    // Camera
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    loadBlock(blocks[0]);

    // Animate
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="w-full h-screen flex flex-col bg-[#FDFBF7] text-[#3D3D3D] font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 px-8 flex items-center justify-between border-b border-[#E6E2D3] bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#6B8E23] rounded-lg shadow-inner flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/50"></div>
          </div>
          <h1 className="font-semibold text-lg tracking-tight">VoxelForge <span className="text-[#A8A391] font-normal">/ Environment Editor</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setStatus('Exporting...')} className="px-4 py-1.5 rounded-full border border-[#D1CCBC] text-sm hover:bg-[#F4F1EA]">Export Pack</button>
          <button onClick={() => setStatus('Refreshing...')} className="px-4 py-1.5 rounded-full bg-[#6B8E23] text-white text-sm font-medium">Live Preview</button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        {/* Left Sidebar: File Explorer */}
        <aside className="w-full md:w-64 bg-[#F4F1EA] border-b md:border-b-0 md:border-r border-[#E6E2D3] flex flex-col p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#A8A391] font-bold mb-4">Block Library</p>
          <nav className="space-y-1 flex-1">
            {blocks.map(block => (
              <div 
                key={block.id}
                onClick={() => {
                    console.log('Sidebar block clicked', block);
                    setSelectedBlock(block.id);
                    loadBlock(block);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border border-[#E6E2D3] shadow-sm cursor-pointer ${selectedBlock === block.id ? 'bg-white' : 'bg-transparent'}`}
              >
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: block.color }}></div>
                <span className="text-sm font-medium">{block.id}.json</span>
              </div>
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t border-[#E6E2D3]">
              <button onClick={() => setShowModal(true)} className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-[#D1CCBC] rounded-lg text-[#A8A391] text-sm hover:text-[#6B8E23] hover:border-[#6B8E23] transition-colors">
              <span>+ New Block</span>
              </button>
          </div>
        </aside>

        {/* Center: Viewport */}
        <section className="flex-1 bg-[#EBE9E1] relative flex items-center justify-center min-h-[300px]">
          <div className="absolute top-6 left-6 flex gap-2 z-10">
            <span className="bg-white/80 backdrop-blur px-3 py-1 rounded text-[11px] font-mono border border-[#D1CCBC]">XYZ: 0, 0, 0</span>
          </div>
          
          <div id="voxel-renderer" ref={mountRef} className="w-full h-full" />

          <div className="absolute bottom-6 flex gap-4 z-50">
            <div className="bg-white p-2 rounded-full shadow-lg flex gap-2 border border-[#E6E2D3]">
              <button onClick={() => {
                console.log('Reload button clicked', { selectedBlock });
                const blockToLoad = blocks.find(b => b.id === selectedBlock);
                if (blockToLoad) {
                    console.log('Found block to load:', blockToLoad);
                    loadBlock(blockToLoad);
                } else {
                    console.log('Could not find block to load for:', selectedBlock);
                }
            }} className="w-10 h-10 rounded-full bg-[#F4F1EA] flex items-center justify-center text-lg"><RefreshCw size={20}/></button>
              <button onClick={() => setStatus('Editing...')} className="w-10 h-10 rounded-full bg-[#6B8E23] flex items-center justify-center text-white text-lg"><Pencil size={20}/></button>
            </div>
          </div>
        </section>
        
        {showModal && (
          <div className="absolute inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-xl space-y-4">
                  <h3 className="text-lg font-bold">Create New Block</h3>
                  <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1">Name</label>
                      <input type="text" value={newBlockName} onChange={e => setNewBlockName(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1">Color</label>
                      <input type="color" value={newBlockColor} onChange={e => setNewBlockColor(e.target.value)} className="w-full h-10 border rounded px-3 py-1 text-sm" />
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded text-sm hover:bg-gray-200">Cancel</button>
                      <button onClick={handleCreateBlock} className="px-4 py-2 bg-[#6B8E23] text-white rounded text-sm hover:bg-[#5a781d]">Create</button>
                  </div>
              </div>
          </div>
        )}

        {/* Right Sidebar */}
        <aside className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-[#E6E2D3] flex flex-col p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-6">Block Definition</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#A8A391] mb-1 block">Block Name</label>
                <input type="text" value={blockName} onChange={(e) => setBlockName(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#E6E2D3] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#6B8E23]"/>
              </div>
            </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="h-8 px-6 bg-[#FDFBF7] border-t border-[#E6E2D3] flex items-center justify-between text-[10px] text-[#A8A391] uppercase tracking-wider">
        <span>● Renderer: ThreeJS / WebGL2</span> <span>● Status: {status}</span>
      </footer>
    </div>
  );
}

