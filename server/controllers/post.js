import PostMessage from "../models/postMessage.js";
import mongoose from "mongoose";

export const getPosts = async (req, res, next) => {
  const { page } = req.query;

  try {
    const LIMIT = 6;
    const startIndex = (Number(page) - 1) * LIMIT; // get the starting index of every page
    const total = await PostMessage.countDocuments({});

    const posts = await PostMessage.find().sort({ _id: -1 }).limit(LIMIT).skip(startIndex);

    res.status(200).json({ data: posts, currentPage: Number(page), numberOfPage: Math.ceil(total/LIMIT) });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getPostsBySearch = async (req,res,next) => {
  const { searchQuery, tags} = req.query;

  try {
    const title = new RegExp(searchQuery, 'i'); //Test test TEST => test

    const posts = await PostMessage.find({ $or: [{ title }, { tags: { $in: tags.split(',') }}]});

    res.json({ data: posts });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}

export const getPost = async (req,res,next) => {
  const { id } = req.params;

  try {
    const post = await PostMessage.findById(id);

    res.status(200).json(post);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}

export const createPost = async (req, res, next) => {
  const post = req.body;

  const newPost = new PostMessage({...post, creator: req.userId, createdAt: new Date().toISOString() });

  try {
    await newPost.save();

    res.status(201).json(newPost);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, message, creator, selectedFile, tags } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No post with id: ${id}`);

  const updatedPost = { creator, title, message, tags, selectedFile, _id: id };

  await PostMessage.findByIdAndUpdate(id, updatedPost, { new: true });

  res.json(updatedPost);
};

export const deletePost = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No post with Id ${id}`);

  await PostMessage.findByIdAndRemove(id);

  res.json({ message: "Post deleted success" });
};

export const likePost = async (req, res) => {
  const { id } = req.params;

  if(!req.userId) return res.json({ message: "Unauthenticated" })

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No post with Id ${id}`);

  const post = await PostMessage.findById(id);

  const index = post.likes.findIndex((id) => id === String(req.userId));
  if(index === -1){
    //like post
    post.likes.push(req.userId)
  }else{
    //dislike post
    post.likes = post.likes.filter((id) => id !== String(req.userId));
  }

  const updatedPost = await PostMessage.findByIdAndUpdate(
    id,
    post,
    { new: true },
  );

  res.json(updatedPost);
};

export const commentPost = async (req,res) => {
  const { id } = req.params;
  const { value } = req.body;
  
  const post = await PostMessage.findById(id);

  post.comments.push(value);

  const updatedPost = await PostMessage.findByIdAndUpdate(id, post, { new: true });

  res.json(updatedPost);
}
