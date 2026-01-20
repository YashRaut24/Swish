import { Router } from 'express';
import { sendSuccess } from '../utils/response.js';

const router = Router();


const stubStore = {
	posts: [],
};


router.get('/posts', (req, res) => sendSuccess(res, { data: { posts: stubStore.posts } }));

router.post('/posts', (req, res) => {
	const now = new Date().toISOString();
	const newPost = {
		_id: `stub-${Date.now()}`,
		caption: req.body?.caption || '',
		media: req.body?.media || [],
		likes: [],
		comments: [],
		savedBy: [],
		author: {
			_id: 'stub-user',
			name: 'You',
		},
		createdAt: now,
		updatedAt: now,
	};
	stubStore.posts.unshift(newPost);
	return sendSuccess(res, { status: 201, data: { post: newPost } });
});

router.get('/notifications', (req, res) => sendSuccess(res, { data: { notifications: [] } }));

router.get('/chats', (req, res) => sendSuccess(res, { data: { chats: [] } }));


router.post('/uploads', (req, res) => {
	const uploaded = [
		{ url: 'https://picsum.photos/seed/stub/600/400', type: 'image' },
	];
	return sendSuccess(res, { status: 201, data: { media: uploaded } });
});

export default router;
