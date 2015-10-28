var investigator = require('../dist/investigator');

runScraping();
var i = 1;

function runScraping() {
  scrapPage('http://example.com');
  setTimeout(() => {
    runScraping();
  }, Math.random() * 15000);
}

function scrapPage(url) {
  const agent = investigator.agent('scraping page', url)
    .async('getData');

  agent.async('downloadPage', url);
  downloadPage(url).then((res) => {
    agent.child('downloadPage')
      .log('status', res.status)
      .resolve(res.size);

    const info = getPageInfo(res);
    agent.child('getPageInfo')
      .log('id:', info.id)
      .log('title:', info.title)
      .log('metas:', info.metas);

    return Promise.all([
      getVideos(res.data.videos, agent),
      getPostsData(res.data.posts, agent),
    ]);
  }).then(() => {
    agent.resolve('Well done !')
  });
}

function getPostsData(posts, agent) {
  agent.async('getPosts');
  return Promise.all(
    posts.map((post) => {
      const postAgent = agent.child('getPosts')
        .child(`post #${post.id}`)
        .log('Retrieving post data...');
      return Promise.all([
        downloadPostImage(post).then((img) => {
          postAgent.success('Image downloaded - status:', img.status);
          return img;
        }).catch((err) => postAgent.error(err)),
        getPostComments(post).then((comments) => {
          if (comments.length)
            postAgent.success(`Comments retrieved (${comments.length})`, comments)
          else
            postAgent.warn(`No comment found`);
          return comments;
        }),
      ]);
    }))
    .then((posts) => {
      agent.child('getPosts').resolve(`${posts.length} posts retrieved`)
    });
}

function getVideos(videos, agent) {
  agent.async('getVideos')
    .log('Downloading', videos.length, 'videos');

  return Promise.all(
    videos.map((video) => {
      return downloadVideo(video)
        .then((data) => {
          agent.child('getVideos')
            .success('video', video.id, 'downloaded');
        });
    }))
    .then((videos) => {
      agent.child('getVideos').resolve(`${videos.length} videos retrieved`)
        .log(videos)
    })
    .catch((err) => {
      agent.child('getVideos').reject(err);
    });
}



function downloadPage(url) {
  return new Promise((resolve) => setTimeout(resolve, Math.random() * 10000, {
    status: 200,
    size: `${Math.round(Math.random() * 30)}kb`,
    data: {
      posts: [{
          id: Math.round(Math.random() * 1000),
          img: null
        }, {
          id: Math.round(Math.random() * 1000),
          img: 'img2.png'
        }, {
          id: Math.round(Math.random() * 1000),
          img: 'img3.png'
        }],
      videos: [{
          id: Math.round(Math.random() * 1000),
          url: 'video1.mp4'
        }, {
          id: Math.round(Math.random() * 1000),
          url: 'video2.mp4'
        }, {
          id: Math.round(Math.random() * 1000),
          url: null
        },{
          id: Math.round(Math.random() * 1000),
          url: null
        }],
    },
  }));
}

function getPageInfo(page) {
  return {
    id: Math.round(Math.random() * 100),
    title: 'Lorem ipsum',
    metas: fakeMetas,
  }
}

function downloadPostImage(post) {
  return new Promise((resolve, reject) => post.img ? setTimeout(resolve, Math.random() * 6000, {status: 200}) :
    setTimeout(reject, Math.random() * 10000, 'Error downloading image'));
}

function getPostComments(post) {
  return new Promise((resolve, reject) => setTimeout(resolve, Math.random() * 6000,
    ['Lorem', 'Ipsum'].slice(0, Math.round(Math.random() * 2))
  ));
}

function downloadVideo(video) {
  return new Promise((resolve, reject) => video.url ? setTimeout(resolve, Math.random() * 6000, {status: 200, size: Math.round(Math.random() * 10, 1)}) :
    setTimeout(reject, Math.random() * 12000, 'Error downloading video'));
}

const fakeMetas = {
  facebook: {
    'og:url': 'https://github.com',
    'og:site_name': 'GitHub',
    'og:title': 'Build software better, together',
    'og:description': 'GitHub is where people build software. More than 11 million people use GitHub to discover, fork, and contribute to over 28 million projects.',
    'og:image': 'https://assets-cdn.github.com/images/modules/open_graph/github-logo.png',
    'og:image:type': 'image/png',
    'og:image:width': '1200',
    'og:image:height': '1200',
    'og:image': 'https://assets-cdn.github.com/images/modules/open_graph/github-mark.png',
    'og:image:type': 'image/png',
    'og:image:width': '1200',
    'og:image:height': '620',
    'og:image': 'https://assets-cdn.github.com/images/modules/open_graph/github-octocat.png',
    'og:image:type': 'image/png',
    'og:image:width': '1200',
    'og:image:height': '620',
  },
  twitter: {
    'twitter:site': 'github',
    'twitter:site:id': '13334762',
    'twitter:creator': 'github',
    'twitter:creator:id': '13334762',
    'twitter:card': 'summary_large_image',
    'twitter:title': 'GitHub',
    'twitter:description': 'GitHub is where people build software. More than 11 million people use GitHub to discover, fork, and contribute to over 28 million projects.',
    'twitter:image:src': 'https://assets-cdn.github.com/images/modules/open_graph/github-logo.png',
    'twitter:image:width': '1200',
    'twitter:image:height': '1200'
  },
  length: 26
}
