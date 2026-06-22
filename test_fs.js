fetch('http://localhost:5173/api/fs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ operation: 'create_directory', targetPath: '/home/hnoloh/Escritorio/prueba_desde_api' })
})
.then(r => r.json())
.then(data => console.log("Result:", data))
.catch(err => console.error("Error:", err));
