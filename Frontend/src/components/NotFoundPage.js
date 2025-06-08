
import {Link} from 'react-router-dom';
   const NotFound = () => {
     return (
       <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f8f9fa' }}>
         <img
           src="https://static.vecteezy.com/system/resources/previews/007/415/858/non_2x/holding-signboard-404-not-found-cute-pear-cartoon-vector.jpg"
           alt="Not Found"
           style={{ width: '150px', height: '150px', marginBottom: '20px' }}
         />
         <h1>404 - Not Found</h1>
         <p>The page you are looking for does not exist.</p>
         <Link to="/">
         <button style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px' }}>
           Go Back to Home
         </button>
         </Link>
        
       </div>
     );
   };

   export default NotFound;