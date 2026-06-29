# Deploying Bloom to Vercel

## ❌ What Causes 404 Error

Bloom is a React Native/Expo web app. When deployed to Vercel without proper configuration:
- Vercel serves static files only
- SPA (Single Page App) routes aren't configured
- All routes except `/` return 404

## ✅ Fix: Configure Vercel for Expo Web

### **Option 1: Automatic (Recommended)**

The `vercel.json` file is already configured. Just:

```bash
npm install -g vercel
vercel --prod
```

### **Option 2: Manual Configuration in Dashboard**

If you've already deployed:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your Bloom project
3. Go to **Settings** → **Build & Development Settings**
4. Set:
   - **Build Command**: `expo export --platform web`
   - **Output Directory**: `dist`
   - **Framework Preset**: `Other`

5. Add **Environment Variables**:
   ```
   EXPO_PUBLIC_GOOGLE_AI_KEY=your_key
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_key
   DYNAMO_TABLE_NAME=Bloom
   ```

6. **Redeploy** (push to git or manually trigger build)

---

## 🔧 Build Process

### **Local Build Test**

Before deploying, test the web build locally:

```bash
npm run build:web
```

This creates an `dist/` folder with the web app.

### **Serve Locally**

```bash
npx http-server dist/
```

Then open: `http://localhost:8080`

---

## 🌐 Vercel Configuration Explained

**vercel.json** tells Vercel:

```json
{
  "buildCommand": "expo export --platform web",  // How to build
  "outputDirectory": "dist",                     // Where output goes
  "rewrites": [                                   // SPA routing fix
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

The **rewrites** are crucial - they send all routes to `index.html`, which React Router handles.

---

## 📋 Deployment Checklist

- [ ] `vercel.json` exists in root
- [ ] `.env.template` has no real keys
- [ ] `.env` is in `.gitignore`
- [ ] Environment variables added to Vercel dashboard
- [ ] `build:web` script works locally
- [ ] `dist/` folder generates correctly

---

## 🐛 Troubleshooting

### **Still Getting 404 After Fix?**

**1. Clear Vercel Cache**
```bash
vercel --prod --yes
```

**2. Check Build Output**
- Go to Vercel dashboard
- Click your project
- Go to **Deployments** tab
- Click latest deployment
- Check **Build Logs** for errors

**3. Verify Environment Variables**
- Settings → Environment Variables
- Make sure all are set

**4. Test Build Locally**
```bash
npm run build:web
npm install -g http-server
npx http-server dist/
```

### **Blank Page Instead of 404?**

Usually means React failed to load. Check:
- Browser Console (F12)
- Check for JavaScript errors
- Verify API keys are correct

### **AI Features Not Working?**

1. Check environment variables in Vercel
2. Test locally: `npm run web`
3. Verify Google AI key is valid
4. Check browser console for API errors

---

## 📱 Alternative Deployments

### **Netlify**

```bash
npm run build:web
netlify deploy --prod --dir=dist
```

### **GitHub Pages**

```bash
npm run build:web
# Copy dist/* to gh-pages branch
```

### **AWS Amplify**

1. Connect GitHub repo
2. Build settings:
   - Build command: `expo export --platform web`
   - Output dir: `dist`
3. Add environment variables
4. Deploy!

---

## ✨ After Deployment

Your app should be live at your Vercel domain:
```
https://bloom-[your-project-name].vercel.app
```

**Features that work:**
- ✅ Upload photo
- ✅ AI space analysis
- ✅ Product recommendations
- ✅ Before/After toggle
- ✅ Save to gallery (with DynamoDB)
- ✅ All UI interactions

**Note:** Image generation (composites) may take 10-30 seconds due to AI processing.

---

## 🚀 Next Deployments

After first deployment, just push to GitHub:

```bash
git add .
git commit -m "Update features"
git push origin main
```

Vercel auto-deploys! 🎉

---

## 📞 Support

If deployment still fails:

1. Check Vercel build logs
2. Run `npm run build:web` locally to test
3. Make sure all env vars are set
4. Check GitHub issues for similar problems

**Your Bloom app should be live soon!** 🌸
