/*
  webpack-mutiPages
  author:HFSK
*/
var path = require('path')
var webpack = require('webpack')
var CopyWebpackPlugin = require('copy-webpack-plugin');

/*
extract-text-webpack-plugin插件，
将所有的入口chunk(entry chunks)中引用的 *.css，移动到独立分离的 CSS 文件，因此，你的样式将不再内嵌到 JS bundle 中，而是会放到一个单独的 CSS 文件（即 styles.css）当中。 如果你的样式文件大小较大，这会做更快提前加载，因为 CSS bundle 会跟 JS bundle 并行加载
 */
var ExtractTextPlugin = require('extract-text-webpack-plugin')
/*
html-webpack-plugin插件，重中之重，webpack中生成HTML的插件，
具体可以去这里查看https://www.npmjs.com/package/html-webpack-plugin
 */
var HtmlWebpackPlugin = require('html-webpack-plugin')
/*
  UglifyJsPlugin 代码压缩
*/
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin
/*
  区分开发和生产环境
*/
const isDevelopEnvronment = process.env.NODE_ENV === 'dev';
const CURRENTENVIRONMENT = process.env.NODE_ENV;
/*
  处理文件路径，多页应用必备
*/
var glob = require('glob');
/*
  打包之前先清理之前的包
**/
var CleanWebpackPlugin = require("clean-webpack-plugin")


function getEntry (globPath, pathDir) {
  var files = glob.sync(globPath)
  var entries = {}, entry, dirname, basename, pathname, extname

  for (var i = 0; i < files.length; i++) {
    entry = files[i]
    dirname = path.dirname(entry)
    extname = path.extname(entry)
    basename = path.basename(entry, extname)
    pathname = path.normalize(path.join(dirname, basename))
    pathDir = path.normalize(pathDir)
    if (pathname.startsWith(pathDir)) {
      pathname = pathname.substring(pathDir.length)
    }
    entries[pathname] = ['babel-polyfill','./' + entry]
  }
  // console.log(entries)
  return entries
}
var entries = getEntry('src/js/page/**/*.js', 'src/js/page/')
var chunks = Object.keys(entries)
isDevelopEnvronment ? publicPath = '': publicPath = './' //publicPath = 'http://192.168.88.20:8898/': publicPath = 'http://h5.cqmfin.com:30012/cq_student_card/'    // 区分生产开发配置不同输出路径
var config = {
  // 配置入口文件
  entry: entries,
  output: {
    path: path.join(__dirname, 'cq_student_card'), // F:\Work\webpack_dst\webpack-dst 输出目录的配置，模板、样式、脚本、图片等资源的路径配置都相对于它
    publicPath: publicPath,       // 模板、样式、脚本、图片等资源对应的server上的路径
    filename: 'js/[name].js',     // 每个页面对应的主js的生成配置
    chunkFilename: 'js/[id].chunk.js'   // chunk生成的配置
  },
  module: {   // loader 配置更新为webpack@3写法
    rules: [
        {
            test: /\.css$/,
            use: ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: [{
                    loader: "css-loader",
                    options: {
                        minimize: true,
                        modules: false,
                        localIdentName: '[name]__[local]--[hash:base64:5]' // 指定css的类名格式  这里有问题 先不用--
                    }
                }, {
                  loader: "postcss-loader",
                  options:{
                      plugins:[
                          require("autoprefixer")({
                              browsers: [
                                  'ie >= 8',
                                  'Firefox >= 20',
                                  'Safari >= 5',
                                  'Android >= 4',
                                  'Ios >= 6',
                                  'last 4 version'
                              ]
                          })
                      ]
                  }
                }],
                publicPath: '../'   // 重置输出路径...
            })
        },
        {
            test: /\.less$/,
            use: [{
                loader: "style-loader" // creates style nodes from JS strings
            }, {
                loader: "css-loader" // translates CSS into CommonJS
            },
            {
              loader: "postcss-loader",
              options:{
                  plugins:[
                      require("autoprefixer")({
                          browsers: [
                              'ie >= 8',
                              'Firefox >= 20',
                              'Safari >= 5',
                              'Android >= 4',
                              'Ios >= 6',
                              'last 4 version'
                          ]
                      })
                  ]
              }
            },
             {
                loader: "less-loader" // compiles Less to CSS
            }]
        },
        {
            test: /\.html$/,
            use: [
                {
                    loader: "html-loader",  // 防止html压缩
                    options: {
                      minimize: false,
                      attrs: ['img:src', ':data-src']
                    }
                }
            ]
        },
        {
            test: /\.(png|jpg|gif|jpeg)$/,
            use: [
                {
                    loader: 'url-loader',
                    options: {
                      limit: 8192,
                      name:'./images/[name][hash].[ext]'   // 图片小于限定值自动转化为base64格式,否则生成img目录通过url 引入
                    }
                }
            ]
        },
        {
            test:/.(svg|ttf|woff|woff2|eot)$/,
            use:[
                'file-loader'
            ]
        },
        {
            test:/\.js$/,
            use:{
                loader:'babel-loader'
            },
            exclude:/node_module/
        }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery"
    }),
    new webpack.DefinePlugin({
      CURRENTENVIRONMENT: JSON.stringify(CURRENTENVIRONMENT)
    }),
    new webpack.BannerPlugin('cq_student_card@version-1'),
    new webpack.optimize.CommonsChunkPlugin({
        name: 'vendors', // 将公共模块提取，生成名为`vendors`的chunk
        chunks: chunks, // 提取哪些模块共有的部分
        minChunks: chunks.length // 设置最少提取长度， 这里设置为全部
    }),
    new ExtractTextPlugin('css/[name].css'),
	  isDevelopEnvronment ? function () {} : new UglifyJsPlugin({ // 生产环境打包压缩代码
                                compress: {
                                  warnings: false
                                },
                                except: ['$super', '$', 'exports', 'require'] // 排除关键字
                              }),
    isDevelopEnvronment ? function () {} :new CleanWebpackPlugin('cq_student_card', { // 匹配要删除的目录
        root: __dirname,
        verbose: true,
        dry: false
    }),
    new CopyWebpackPlugin([
      {
        from:'./src/img',
        to: './img'
      }
    ])
  ],
  // 使用webpack-dev-server，提高开发效率
  devServer: {
    contentBase: './',
    host: '192.168.20.41',
    port: 8901,
    inline: true
  },
  devtool: isDevelopEnvronment ? 'source-map': ''
}
var pages = Object.keys(getEntry('src/view/**/*.html', 'src/view/'))
pages.forEach(function (pathname) {  // 遍历所有页面 循环输出
  var conf = {
    filename: './' + pathname + '.html', // 生成的html存放路径，相对于path
    template: './src/view/' + pathname + '.html', // html模板路径
    /*
     * 压缩这块，调用了html-minify，会导致压缩时候的很多html语法检查问题，
     * 如在html标签属性上使用{{...}}表达式，很多情况下并不需要在此配置压缩项，
     * 另外，UglifyJsPlugin会在压缩代码的时候连同html一起压缩。
     * 为避免压缩html，需要在html-loader上配置'html?-minimize'，见loaders中html-loader的配置。
     */
    // minify: { //压缩HTML文件
    //  removeComments: true, //移除HTML中的注释
    //  collapseWhitespace: false //删除空白符与换行符
    // }
  }
  if (pathname in config.entry) {
    //conf.favicon = path.resolve(__dirname, 'src/images/favicon.ico')
    conf.inject = 'body' // js插入的位置，true/'head'/'body'/false
    conf.chunks = ['vendors', pathname]
    conf.hash = true
  }
  config.plugins.push(new HtmlWebpackPlugin(conf))
})

module.exports = config
