const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const ProjectInvitation = require('../models/ProjectInvitation');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const Attachment = require('../models/Attachment');

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow';
    await mongoose.connect(mongoUri);
    console.log(`[Seed] Connected to MongoDB at ${mongoUri}`);

    // Clear existing collections
    console.log('[Seed] Cleaning old data...');
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      ProjectMember.deleteMany({}),
      ProjectInvitation.deleteMany({}),
      Task.deleteMany({}),
      Comment.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      Activity.deleteMany({}),
      Attachment.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');
    const users = await User.create([
      {
        name: 'System Admin',
        email: 'admin@taskflow.com',
        password: 'password123',
        globalRole: 'admin',
        bio: 'TaskFlow System Administrator and Platform Supervisor',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
      {
        name: 'Mahesh Sharma',
        email: 'mahesh@taskflow.com',
        password: 'password123',
        globalRole: 'user',
        bio: 'Senior Full Stack Tech Lead & Product Architect',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        name: 'Rahul Verma',
        email: 'rahul@taskflow.com',
        password: 'password123',
        globalRole: 'user',
        bio: 'Backend & Systems Engineer specializing in Node.js & MongoDB',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
      {
        name: 'Priya Patel',
        email: 'priya@taskflow.com',
        password: 'password123',
        globalRole: 'user',
        bio: 'Frontend Architect & UI/UX Specialist (React, Tailwind)',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
      {
        name: 'Sai Krishna',
        email: 'sai@taskflow.com',
        password: 'password123',
        globalRole: 'user',
        bio: 'QA Engineer & Automation Tester',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      },
    ]);

    const [admin, mahesh, rahul, priya, sai] = users;

    console.log('[Seed] Creating primary project: EasyCart Development...');
    const easyCart = await Project.create({
      name: 'EasyCart Development',
      description: 'Build a production-grade full-stack e-commerce marketplace platform with real-time inventory, secure Stripe checkout, and automated analytics.',
      objective: 'Deliver an enterprise shopping experience for 50k+ daily active users.',
      owner: mahesh._id,
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: new Date('2026-10-01'),
      dueDate: new Date('2026-11-30'),
      labels: [
        { name: 'Backend', color: '#10b981' },
        { name: 'Frontend', color: '#3b82f6' },
        { name: 'Security', color: '#ef4444' },
        { name: 'UI/UX', color: '#f59e0b' },
        { name: 'Testing', color: '#8b5cf6' },
      ],
    });

    console.log('[Seed] Adding project members to EasyCart...');
    await ProjectMember.create([
      { project: easyCart._id, user: mahesh._id, role: 'owner' },
      { project: easyCart._id, user: rahul._id, role: 'manager' },
      { project: easyCart._id, user: priya._id, role: 'member' },
      { project: easyCart._id, user: sai._id, role: 'member' },
    ]);

    console.log('[Seed] Creating invitations...');
    await ProjectInvitation.create([
      {
        token: '8FJ29KX9P2',
        project: easyCart._id,
        createdBy: mahesh._id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxUses: 10,
        usedCount: 3,
        status: 'ACTIVE',
        role: 'member',
      },
      {
        token: 'VIPDEV2026',
        project: easyCart._id,
        createdBy: mahesh._id,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        maxUses: 5,
        usedCount: 1,
        status: 'ACTIVE',
        role: 'manager',
      },
    ]);

    console.log('[Seed] Creating realistic tasks...');
    const taskAuth = await Task.create({
      title: 'Build Authentication & JWT Middleware',
      description: 'Implement secure registration, login with bcrypt password hashing, JWT authorization headers, and role-based permissions.',
      project: easyCart._id,
      createdBy: mahesh._id,
      assignedTo: rahul._id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      startDate: new Date('2026-10-02'),
      dueDate: new Date('2026-10-10'),
      labels: ['Backend', 'Security'],
      checklist: [
        { title: 'User Mongoose Schema & validation', completed: true, completedBy: rahul._id, completedAt: new Date() },
        { title: 'Registration & Login endpoints', completed: true, completedBy: rahul._id, completedAt: new Date() },
        { title: 'JWT token generator & verify middleware', completed: true, completedBy: rahul._id, completedAt: new Date() },
        { title: 'Refresh token rotation support', completed: false },
        { title: 'Unit test suite with Jest / Supertest', completed: false },
      ],
      order: 0,
    });

    const taskProductCatalog = await Task.create({
      title: 'Design Responsive Product Catalog & Filters',
      description: 'Create ultra-responsive product grid with instant search, category filters, price slider, and sorting dropdowns.',
      project: easyCart._id,
      createdBy: mahesh._id,
      assignedTo: priya._id,
      status: 'IN_REVIEW',
      priority: 'HIGH',
      startDate: new Date('2026-10-01'),
      dueDate: new Date('2026-10-08'),
      labels: ['Frontend', 'UI/UX'],
      reviewSubmittedBy: priya._id,
      reviewSubmittedAt: new Date(),
      reviewNotes: 'Completed layout, responsive mobile drawer filters, and category cards. Ready for team leader review!',
      checklist: [
        { title: 'Create ProductCard component with skeleton states', completed: true, completedBy: priya._id, completedAt: new Date() },
        { title: 'Implement category filter tabs', completed: true, completedBy: priya._id, completedAt: new Date() },
        { title: 'Integrate price range debounced filtering', completed: true, completedBy: priya._id, completedAt: new Date() },
        { title: 'Test on mobile and tablet viewport', completed: true, completedBy: priya._id, completedAt: new Date() },
      ],
      order: 1,
    });

    const taskPayment = await Task.create({
      title: 'Stripe Payment Gateway Integration',
      description: 'Integrate Stripe Webhooks, checkout sessions, and automated order confirmation emails.',
      project: easyCart._id,
      createdBy: mahesh._id,
      assignedTo: rahul._id,
      status: 'TODO',
      priority: 'URGENT',
      startDate: new Date('2026-10-12'),
      dueDate: new Date('2026-10-20'),
      labels: ['Backend', 'Security'],
      checklist: [
        { title: 'Configure Stripe SDK & webhook secret', completed: false },
        { title: 'Create checkout session controller', completed: false },
        { title: 'Handle payment_intent.succeeded webhook', completed: false },
      ],
      order: 2,
    });

    const taskTests = await Task.create({
      title: 'Automated E2E Testing Suite with Playwright',
      description: 'Write end-to-end regression tests covering user registration, adding item to cart, and checkout flow.',
      project: easyCart._id,
      createdBy: mahesh._id,
      assignedTo: sai._id,
      status: 'TODO',
      priority: 'MEDIUM',
      startDate: new Date('2026-10-15'),
      dueDate: new Date('2026-10-25'),
      labels: ['Testing'],
      checklist: [
        { title: 'Setup Playwright configuration', completed: false },
        { title: 'Test authentication flow', completed: false },
        { title: 'Test checkout process', completed: false },
      ],
      order: 3,
    });

    const taskDocs = await Task.create({
      title: 'REST API Documentation & Swagger Spec',
      description: 'Document all REST endpoints, request/response formats, error codes, and headers.',
      project: easyCart._id,
      createdBy: mahesh._id,
      assignedTo: mahesh._id,
      status: 'DONE',
      priority: 'LOW',
      startDate: new Date('2026-09-25'),
      dueDate: new Date('2026-10-01'),
      labels: ['Backend'],
      checklist: [
        { title: 'Draft OpenAPI 3.0 specification', completed: true, completedBy: mahesh._id, completedAt: new Date() },
        { title: 'Export Postman Collection v2.1', completed: true, completedBy: mahesh._id, completedAt: new Date() },
      ],
      order: 4,
    });

    console.log('[Seed] Adding task comments...');
    await Comment.create([
      {
        task: taskAuth._id,
        user: rahul._id,
        content: 'Registration API and JWT authentication middleware have been implemented and tested.',
      },
      {
        task: taskAuth._id,
        user: mahesh._id,
        content: 'Awesome work Rahul! Please make sure to add refresh token rotation support before submitting for review.',
      },
      {
        task: taskAuth._id,
        user: rahul._id,
        content: "Will do Mahesh, working on the token expiration handler right now.",
      },
      {
        task: taskProductCatalog._id,
        user: priya._id,
        content: 'Submitted for review! Grid animations and responsive drawers are working smoothly across devices.',
      },
    ]);

    console.log('[Seed] Adding project chat messages...');
    await Message.create([
      {
        project: easyCart._id,
        sender: mahesh._id,
        content: 'Welcome everyone to the EasyCart Development workspace! Let us build a top-tier e-commerce experience.',
      },
      {
        project: easyCart._id,
        sender: rahul._id,
        content: "I'm handling the authentication engine and backend microservices architecture.",
      },
      {
        project: easyCart._id,
        sender: priya._id,
        content: "I've drafted the product catalog and modern UI components. Submitting for review shortly.",
      },
      {
        project: easyCart._id,
        sender: sai._id,
        content: 'All test environments are prepped. Ready to write the automated test suites!',
      },
    ]);

    console.log('[Seed] Adding activity history...');
    await Activity.create([
      {
        project: easyCart._id,
        user: mahesh._id,
        action: 'PROJECT_CREATED',
        description: 'Mahesh Sharma created project "EasyCart Development"',
      },
      {
        project: easyCart._id,
        user: rahul._id,
        action: 'MEMBER_JOINED',
        description: 'Rahul Verma joined the project via invitation link.',
      },
      {
        project: easyCart._id,
        user: priya._id,
        action: 'MEMBER_JOINED',
        description: 'Priya Patel joined the project via invitation link.',
      },
      {
        project: easyCart._id,
        user: sai._id,
        action: 'MEMBER_JOINED',
        description: 'Sai Krishna joined the project via invitation link.',
      },
      {
        project: easyCart._id,
        task: taskAuth._id,
        user: mahesh._id,
        action: 'TASK_CREATED',
        description: 'Mahesh Sharma created task "Build Authentication & JWT Middleware"',
      },
      {
        project: easyCart._id,
        task: taskProductCatalog._id,
        user: priya._id,
        action: 'TASK_SUBMITTED',
        description: 'Priya Patel submitted "Design Responsive Product Catalog & Filters" for review',
      },
    ]);

    console.log('[Seed] Adding notifications...');
    await Notification.create([
      {
        recipient: mahesh._id,
        sender: priya._id,
        type: 'TASK_SUBMITTED',
        title: 'Task Awaiting Review',
        message: 'Priya Patel submitted "Design Responsive Product Catalog & Filters" for review',
        project: easyCart._id,
        task: taskProductCatalog._id,
        isRead: false,
      },
      {
        recipient: rahul._id,
        sender: mahesh._id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: 'Mahesh Sharma assigned you to task "Build Authentication & JWT Middleware"',
        project: easyCart._id,
        task: taskAuth._id,
        isRead: true,
      },
    ]);

    // Create 2 more projects: EduPilot Development and Portfolio Development
    console.log('[Seed] Creating secondary projects...');
    const eduPilot = await Project.create({
      name: 'EduPilot Learning Management System',
      description: 'Next-generation AI tutoring platform offering interactive code playgrounds, quizzes, and live classrooms.',
      objective: 'Empower modern tech educators and online bootcamps.',
      owner: mahesh._id,
      status: 'PLANNING',
      priority: 'MEDIUM',
      startDate: new Date('2026-11-01'),
      dueDate: new Date('2026-12-31'),
    });
    await ProjectMember.create({ project: eduPilot._id, user: mahesh._id, role: 'owner' });

    const portfolio = await Project.create({
      name: 'DevPortfolio Showcase 2026',
      description: 'Modern developer portfolio template featuring interactive 3D elements, dynamic blog, and project showcase.',
      objective: 'Showcase high-impact full-stack and cloud engineering projects.',
      owner: rahul._id,
      status: 'ACTIVE',
      priority: 'MEDIUM',
      startDate: new Date('2026-09-15'),
      dueDate: new Date('2026-10-30'),
    });
    await ProjectMember.create([
      { project: portfolio._id, user: rahul._id, role: 'owner' },
      { project: portfolio._id, user: mahesh._id, role: 'manager' },
    ]);

    console.log('========================================================');
    console.log('✅ Seed Database completed successfully!');
    console.log('Demo Credentials:');
    console.log('  Admin:       admin@taskflow.com / password123');
    console.log('  Team Leader: mahesh@taskflow.com / password123');
    console.log('  Members:     rahul@taskflow.com, priya@taskflow.com, sai@taskflow.com / password123');
    console.log('Primary Project: "EasyCart Development"');
    console.log('Invitation Token: 8FJ29KX9P2');
    console.log('========================================================');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedDB();
