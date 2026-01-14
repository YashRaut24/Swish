import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

console.log('Testing Cloudinary Configuration...\n');

console.log('Environment Variables:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  console.log('\n✓ Cloudinary configured successfully');
  console.log('\nTrying to fetch API resources to verify connection...');
  
  cloudinary.api.ping()
    .then(result => {
      console.log('✓ Cloudinary connection successful!');
      console.log('Response:', result);
    })
    .catch(error => {
      console.error('✗ Cloudinary connection failed:');
      console.error('Error:', error.message);
      console.error('Error details:', error);
    });
} else {
  console.log('\n✗ Cloudinary configuration incomplete!');
}
