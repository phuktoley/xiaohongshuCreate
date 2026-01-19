// 人设类型
export type PersonaType = "senior_sister" | "professional" | "anxious" | "critic";

// 业务场景
export type Scenario = "delay" | "dropout" | "misconduct" | "fail" | "leave" | "withdraw";

// 目标情绪
export type Emotion = "empathy" | "warning" | "help" | "success" | "critic";

// 封面类型
export type CoverType = "big_text" | "screenshot" | "comparison" | "person" | "chat";

// 生成类型
export type GenerationType = "title" | "note" | "hashtag" | "cover";

// 场景配置
export const SCENARIOS: Record<Scenario, { label: string; keywords: string[] }> = {
  delay: { label: "延期", keywords: ["延期入学", "考试延期", "deadline延期", "EC申请"] },
  dropout: { label: "退学", keywords: ["被退学", "劝退", "开除", "复学"] },
  misconduct: { label: "学术不端", keywords: ["抄袭", "AI检测", "cheating", "作弊", "Turnitin"] },
  fail: { label: "挂科", keywords: ["挂科", "补考", "成绩复议", "重修"] },
  leave: { label: "休学", keywords: ["休学", "gap year", "中断学业", "LOA"] },
  withdraw: { label: "撤课", keywords: ["撤课", "withdraw", "退课", "非常规撤课"] },
};

// 情绪配置
export const EMOTIONS: Record<Emotion, { label: string; color: string; emoji: string[] }> = {
  empathy: { label: "共鸣型", color: "#FF6B9D", emoji: ["😭", "🥺", "💔", "😢"] },
  warning: { label: "警示型", color: "#FF4D4F", emoji: ["⚠️", "❌", "🚫", "‼️"] },
  help: { label: "求助型", color: "#1890FF", emoji: ["🙏", "🆘", "❓", "😰"] },
  success: { label: "成功型", color: "#52C41A", emoji: ["✅", "🎉", "💪", "🔥"] },
  critic: { label: "吐槽型", color: "#722ED1", emoji: ["😅", "🤡", "💀", "🙄"] },
};

// 预设人设配置
export const DEFAULT_PERSONAS: Record<PersonaType, {
  name: string;
  description: string;
  greetings: string[];
  toneWords: string[];
  emojiStyle: string[];
  samplePhrases: string[];
}> = {
  senior_sister: {
    name: "过来人学姐",
    description: "亲历者视角，真实经验分享，亲切真诚略带自嘲",
    greetings: ["hi大家", "姐妹们", "宝子们", "集美们"],
    toneWords: ["说实话", "有一说一", "真的", "其实", "哈哈"],
    emojiStyle: ["😊", "🙈", "💪", "✨", "🥹"],
    samplePhrases: [
      "说实话当时我也慌得一批",
      "这个坑我替你们踩过了",
      "有一说一，这个过程真的没那么难",
      "姐妹们我真的要哭了",
    ],
  },
  professional: {
    name: "专业顾问",
    description: "专业人士视角，干货输出，专业有条理但不生硬",
    greetings: ["今天来聊聊", "给大家科普一下", "分享一个案例", "来说说"],
    toneWords: ["其实", "事实上", "根据经验", "关键在于", "建议"],
    emojiStyle: ["📌", "💡", "✅", "📝", "🔍"],
    samplePhrases: [
      "这种情况在申诉中很常见",
      "关键点在于...",
      "根据我的经验，成功率大概在...",
      "这里有几个要点需要注意",
    ],
  },
  anxious: {
    name: "焦虑求助者",
    description: "正在经历困境的留学生，焦虑真实情绪化",
    greetings: ["救命", "姐妹们帮帮我", "急急急", "在线等"],
    toneWords: ["真的", "怎么办", "好慌", "救命", "急"],
    emojiStyle: ["😭", "🙏", "🆘", "😰", "💔"],
    samplePhrases: [
      "现在真的不知道该怎么办了",
      "有没有类似经历的姐妹",
      "在线等，很急",
      "救命啊谁来帮帮我",
    ],
  },
  critic: {
    name: "吐槽达人",
    description: "犀利点评，揭露行业乱象，幽默带点愤怒",
    greetings: ["我真的服了", "离大谱", "笑死", "绝了"],
    toneWords: ["真的服了", "离谱", "笑死", "绝了", "无语"],
    emojiStyle: ["😅", "🤡", "💀", "🙄", "😂"],
    samplePhrases: [
      "这波操作我真的看不懂",
      "8000块就买了个教训",
      "建议这种机构早点倒闭",
      "我不是针对谁，但这也太离谱了",
    ],
  },
};

// 标题模板
export const TITLE_TEMPLATES: Record<Emotion, string[]> = {
  empathy: [
    "关于我{scenario}这件事",
    "{school}再见，我{action}了",
    "没想到我也遇到了{problem}",
    "{scenario}，真的会死吗？",
  ],
  warning: [
    "避雷！{target}",
    "这辈子不会再找{target}",
    "{amount}买{service}的血泪教训",
    "千万别{action}！",
  ],
  help: [
    "{scenario}了，求好的解决办法",
    "{problem}怎么办！",
    "谁来救救我",
    "在线等！{scenario}急需帮助",
  ],
  success: [
    "{time}后我{result}成功",
    "{school}{scenario}成功，经验分享",
    "我不是中介，来说说{topic}",
    "{scenario}指控驳回（无中介）",
  ],
  critic: [
    "我真的服了这个{target}",
    "{amount}打水漂的经历",
    "笑死，{event}",
    "这{target}也太离谱了吧",
  ],
};

// 话题标签库
export const HASHTAG_LIBRARY = {
  general: ["#留学", "#留学生", "#留学生活", "#海外留学", "#出国留学"],
  scenario: {
    delay: ["#延期", "#deadline", "#EC申请", "#延期入学"],
    dropout: ["#退学", "#被开除", "#劝退", "#复学", "#学业危机"],
    misconduct: ["#学术不端", "#抄袭", "#cheating", "#AI检测", "#Turnitin"],
    fail: ["#挂科", "#挂科申诉", "#补考", "#成绩复议", "#重修"],
    leave: ["#休学", "#gap year", "#中断学业", "#LOA"],
    withdraw: ["#撤课", "#非常规撤课", "#withdraw", "#退课"],
  },
  school: {
    uk: ["#英国留学", "#UCL", "#LSE", "#IC", "#曼大", "#爱丁堡", "#KCL"],
    au: ["#澳洲留学", "#悉大", "#墨大", "#UNSW", "#莫纳什", "#ANU"],
    us: ["#美国留学", "#NYU", "#USC", "#UCLA", "#哥大", "#波士顿"],
    ca: ["#加拿大留学", "#多大", "#UBC", "#麦吉尔", "#滑铁卢"],
    hk: ["#香港留学", "#港大", "#港中文", "#港科大", "#城大"],
  },
  appeal: ["#学术申诉", "#留学申诉", "#appeal", "#申诉成功", "#申诉经验"],
};

// 封面配色方案
export const COVER_COLORS: Record<Emotion, { primary: string; secondary: string; text: string }> = {
  empathy: { primary: "#FF6B9D", secondary: "#FFE4EC", text: "#FFFFFF" },
  warning: { primary: "#FF4D4F", secondary: "#FFF1F0", text: "#FFFFFF" },
  help: { primary: "#1890FF", secondary: "#E6F7FF", text: "#FFFFFF" },
  success: { primary: "#52C41A", secondary: "#F6FFED", text: "#FFFFFF" },
  critic: { primary: "#722ED1", secondary: "#F9F0FF", text: "#FFFFFF" },
};

// 留学地区和学校数据库
export type SchoolRegion = "uk" | "au" | "us" | "ca" | "hk" | "sg" | "eu";

export const SCHOOL_DATABASE: Record<SchoolRegion, { label: string; schools: { name: string; abbr: string }[] }> = {
  uk: {
    label: "英国",
    schools: [
      { name: "伦敦大学学院", abbr: "UCL" },
      { name: "帝国理工学院", abbr: "IC" },
      { name: "伦敦政治经济学院", abbr: "LSE" },
      { name: "伦敦国王学院", abbr: "KCL" },
      { name: "曼彻斯特大学", abbr: "曼大" },
      { name: "爱丁堡大学", abbr: "爱大" },
      { name: "华威大学", abbr: "华威" },
      { name: "布里斯托大学", abbr: "布大" },
      { name: "格拉斯哥大学", abbr: "格大" },
      { name: "伯明翰大学", abbr: "伯明翰" },
      { name: "利兹大学", abbr: "利兹" },
      { name: "南安普顿大学", abbr: "南安" },
      { name: "诺丁汉大学", abbr: "诺丁汉" },
      { name: "谢菲尔德大学", abbr: "谢菲" },
      { name: "杜伦大学", abbr: "杜伦" },
      { name: "兰卡斯特大学", abbr: "兰卡" },
      { name: "巴斯大学", abbr: "巴斯" },
      { name: "埃克塞特大学", abbr: "埃克塞特" },
    ],
  },
  au: {
    label: "澳洲",
    schools: [
      { name: "悉尼大学", abbr: "悉大" },
      { name: "墨尔本大学", abbr: "墨大" },
      { name: "新南威尔士大学", abbr: "UNSW" },
      { name: "澳洲国立大学", abbr: "ANU" },
      { name: "莫纳什大学", abbr: "莫纳什" },
      { name: "昆士兰大学", abbr: "UQ" },
      { name: "西澳大学", abbr: "UWA" },
      { name: "阿德莱德大学", abbr: "阿大" },
      { name: "悉尼科技大学", abbr: "UTS" },
      { name: "麦考瑞大学", abbr: "MQ" },
      { name: "皇家墨尔本理工", abbr: "RMIT" },
    ],
  },
  us: {
    label: "美国",
    schools: [
      { name: "纽约大学", abbr: "NYU" },
      { name: "南加州大学", abbr: "USC" },
      { name: "加州大学洛杉矶分校", abbr: "UCLA" },
      { name: "哥伦比亚大学", abbr: "哥大" },
      { name: "波士顿大学", abbr: "BU" },
      { name: "东北大学", abbr: "NEU" },
      { name: "加州大学伯克利分校", abbr: "UCB" },
      { name: "宾夕法尼亚大学", abbr: "宾大" },
      { name: "康奈尔大学", abbr: "康奈尔" },
      { name: "卡内基梅隆大学", abbr: "CMU" },
      { name: "约翰霍普金斯大学", abbr: "JHU" },
      { name: "伊利诺伊大学香槟分校", abbr: "UIUC" },
      { name: "密歇根大学", abbr: "UMich" },
      { name: "华盛顿大学", abbr: "UW" },
    ],
  },
  ca: {
    label: "加拿大",
    schools: [
      { name: "多伦多大学", abbr: "多大" },
      { name: "英属哥伦比亚大学", abbr: "UBC" },
      { name: "麦吉尔大学", abbr: "麦吉尔" },
      { name: "滑铁卢大学", abbr: "滑铁卢" },
      { name: "阿尔伯塔大学", abbr: "阿大" },
      { name: "麦克马斯特大学", abbr: "McMaster" },
      { name: "女王大学", abbr: "Queen's" },
      { name: "西安大略大学", abbr: "Western" },
      { name: "渥太华大学", abbr: "渥大" },
      { name: "约克大学", abbr: "York" },
    ],
  },
  hk: {
    label: "香港",
    schools: [
      { name: "香港大学", abbr: "港大" },
      { name: "香港中文大学", abbr: "港中文" },
      { name: "香港科技大学", abbr: "港科大" },
      { name: "香港城市大学", abbr: "城大" },
      { name: "香港理工大学", abbr: "理大" },
      { name: "香港浸会大学", abbr: "浸会" },
    ],
  },
  sg: {
    label: "新加坡",
    schools: [
      { name: "新加坡国立大学", abbr: "NUS" },
      { name: "南洋理工大学", abbr: "NTU" },
      { name: "新加坡管理大学", abbr: "SMU" },
    ],
  },
  eu: {
    label: "欧洲其他",
    schools: [
      { name: "阿姆斯特丹大学", abbr: "UvA" },
      { name: "代尔夫特理工", abbr: "TU Delft" },
      { name: "慕尼黑工业大学", abbr: "TUM" },
      { name: "苏黎世联邦理工", abbr: "ETH" },
      { name: "巴黎高等商学院", abbr: "HEC" },
      { name: "博科尼大学", abbr: "Bocconi" },
    ],
  },
};

// 爆款内容数据库
export const HOT_CONTENT_DATABASE = [
  { title: "关于我研究生读到一半休学这件事", likes: 5143, scenario: "leave", pattern: "关于我...这件事", emotion: "empathy" },
  { title: "休学、搬家，我从斯坦福消失的这一年", likes: 1642, scenario: "leave", pattern: "故事型", emotion: "empathy" },
  { title: "学术不端指控驳回（无中介）", likes: 1311, scenario: "misconduct", pattern: "成功+无中介", emotion: "success" },
  { title: "这位伯明翰补考挂科的哥们，你要被劝退了", likes: 1132, scenario: "fail", pattern: "第三人称警示", emotion: "warning" },
  { title: "一次挂科之后。。我学到了", likes: 631, scenario: "fail", pattern: "经验分享", emotion: "empathy" },
  { title: "95后留学生，休学后身价70亿", likes: 608, scenario: "leave", pattern: "反转震撼", emotion: "success" },
  { title: "某留学申诉机构，劝大家避雷", likes: 573, scenario: "misconduct", pattern: "避雷型", emotion: "warning" },
  { title: "城大留位费申请延期成功（模版在图2图3）", likes: 680, scenario: "delay", pattern: "成功+模版", emotion: "success" },
  { title: "IC再见，我休学了", likes: 414, scenario: "leave", pattern: "告别型", emotion: "empathy" },
  { title: "新南AI率高被指控学术不端：三步成功洗白", likes: 77, scenario: "misconduct", pattern: "步骤型", emotion: "success" },
  { title: "被UCL退学后，我是怎么翻盘的", likes: 892, scenario: "dropout", pattern: "逆袭型", emotion: "success" },
  { title: "留学生挂科申诉全攻略（亲测有效）", likes: 756, scenario: "fail", pattern: "攻略型", emotion: "success" },
  { title: "我花了3万找中介申诉，结果...", likes: 1024, scenario: "misconduct", pattern: "悬念型", emotion: "warning" },
  { title: "Turnitin查重率80%，我是怎么过的", likes: 445, scenario: "misconduct", pattern: "数据型", emotion: "success" },
  { title: "延期申请被拒？试试这个方法", likes: 367, scenario: "delay", pattern: "建议型", emotion: "help" },
  { title: "休学一年后，我想明白了这些事", likes: 523, scenario: "leave", pattern: "感悟型", emotion: "empathy" },
  { title: "被指控作弊的第7天，我崩溃了", likes: 789, scenario: "misconduct", pattern: "日记型", emotion: "empathy" },
  { title: "这个学校的撤课政策也太坑了", likes: 234, scenario: "withdraw", pattern: "吐槽型", emotion: "critic" },
  { title: "补考前一天，我做了这件事", likes: 456, scenario: "fail", pattern: "悬念型", emotion: "empathy" },
  { title: "留学5年，我被退学了3次", likes: 1567, scenario: "dropout", pattern: "震撼型", emotion: "empathy" },
];
