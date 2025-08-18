# GitHub Pages Deployment Guide

This guide will help you deploy your React PWA Showcase to GitHub Pages.

## Prerequisites

- GitHub account
- Git installed locally
- Node.js 18+ installed

## Deployment Methods

### Method 1: Automatic Deployment with GitHub Actions (Recommended)

This method automatically deploys your app whenever you push to the main branch.

#### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `react-pwa-showcase` (or update the `base` in `vite.config.ts` to match your repo name)
3. Make it public (required for free GitHub Pages)
4. Don't initialize with README, .gitignore, or license (we already have these)

#### Step 2: Connect Local Repository to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: React PWA Showcase setup"

# Add remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/react-pwa-showcase.git

# Push to GitHub
git push -u origin main
```

#### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. The workflow will automatically run on your next push

#### Step 4: Update Repository Name (if different)

If your repository name is different from `react-pwa-showcase`, update the `base` in `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  base: "/YOUR_REPOSITORY_NAME/", // Replace with your actual repo name
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
```

### Method 2: Manual Deployment with gh-pages

This method allows you to deploy manually using the `gh-pages` package.

#### Deploy Manually

```bash
# Build and deploy
npm run deploy
```

This will:
1. Run `npm run build` to create the production build
2. Deploy the `dist` folder to the `gh-pages` branch
3. GitHub Pages will automatically serve from the `gh-pages` branch

#### Enable GitHub Pages for Manual Method

1. Go to your repository settings
2. In the **Pages** section, set **Source** to **Deploy from a branch**
3. Select **gh-pages** branch and **/ (root)** folder
4. Click **Save**

## Verification

After deployment, your app will be available at:
```
https://YOUR_USERNAME.github.io/react-pwa-showcase/
```

## Troubleshooting

### Common Issues

1. **404 Error on Refresh**: The `404.html` file handles client-side routing for SPAs
2. **Assets Not Loading**: Check that the `base` in `vite.config.ts` matches your repository name
3. **Build Fails**: Ensure all linting and formatting checks pass locally first

### Local Testing

Test your production build locally before deploying:

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

### GitHub Actions Troubleshooting

If the GitHub Actions deployment fails:

1. Check the **Actions** tab in your repository for error details
2. Ensure your repository has **Pages** enabled in settings
3. Verify that the workflow has the necessary permissions:
   - Go to **Settings** > **Actions** > **General**
   - Under **Workflow permissions**, select **Read and write permissions**

## Environment Variables

For production environment variables:

1. Create repository secrets in **Settings** > **Secrets and variables** > **Actions**
2. Add secrets with names starting with `VITE_` (e.g., `VITE_API_URL`)
3. These will be available in your build process

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to the `public` folder with your domain name
2. Configure your domain's DNS to point to GitHub Pages
3. Enable HTTPS in repository settings

## Monitoring

- Check deployment status in the **Actions** tab
- Monitor your site at the GitHub Pages URL
- Use browser dev tools to check for any console errors

## Next Steps

After successful deployment:

1. Test all PWA features on the live site
2. Verify offline functionality
3. Test installation on mobile devices
4. Monitor performance with Lighthouse