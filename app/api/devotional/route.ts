import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


interface Devotional {
  type: string;
  title: string;
  title_zh?: string;
  scripture: string;
  scripture_zh?: string;
  reference: string;
  prayer: string;
  prayer_zh?: string;
  reflection: string;
  reflection_zh?: string;
  hymn?: string;
  hymn_zh?: string;
}

function getLiturgicalSeason(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (m === 12 && d >= 24) return "christmas";
  if (m === 12 && d >= 1) return "advent";
  if (m === 1 && d <= 6) return "epiphany";
  if (m === 2 && d >= 14 && d <= 22) return "lent"; // varies
  if (m === 3 || (m === 4 && d <= 10)) return "lent";
  if (m === 4 && d >= 13 && d <= 19) return "holy_week";
  if (m === 4 && d >= 20 && d <= 30) return "easter";
  if (m === 5) return "easter";
  return "ordinary";
}

const morningPrayers: Devotional[] = [
  {
    type: "morning", title: "Morning Light", title_vi: "Ánh sáng ban mai", title_zh: "晨光", title_th: "แสงสว่างยามเช้า", title_ko: "아침 빛", title_ja: "朝の光",
    scripture: "This is the day that the LORD has made; let us rejoice and be glad in it.",
    scripture_zh: "这是耶和华所定的日子，我们在其中要高兴欢喜。",
    scripture_th: "นี่คือวันที่พระเจ้าทรงสร้าง ให้เราเปรมปรีดิ์และยินดีในวันนี้",
    scripture_ko: "이 날은 여호와께서 정하신 것이라 이 날에 우리가 즐거워하고 기뻐하리로다",
    scripture_ja: "これは主が設けられた日。この日を楽しみ喜ぼう。",
    title_th: "แสงเช้า",
    title_ko: "아침 빛",
    title_ja: "朝の光",
    scripture_th: "นี่คือวันที่พระเจ้าทรงสร้าง ให้เราชื่นชมยินดีในวันนี้",
    scripture_ko: "이 날은 여호와께서 정하신 것이라 이 날에 우리가 즐거워하고 기뻐하리로다",
    scripture_ja: "これは主が設けられた日。この日を楽しみ喜ぼう。",
    scripture_vi: "Đây là ngày Đức Giê-hô-va đã định; chúng ta hãy mừng rỡ và vui vẻ trong ngày ấy.",
    scripture_vi: "Tôi làm được mọi sự nhờ Đấng ban thêm sức cho tôi.",
    scripture_vi: "Nhờ sự nhân từ lớn lao của Đức Giê-hô-va mà chúng ta không bị tiêu diệt, vì sự thương xót Ngài không hề dứt. Mỗi buổi sáng đều mới; sự thành tín Ngài thật lớn lao!",
    scripture_vi: "Hỡi những ai mệt mỏi và gánh nặng, hãy đến cùng ta, ta sẽ cho các ngươi được yên nghỉ.",
    scripture_vi: "Đức Giê-hô-va là sức lực và là cái khiên của tôi; lòng tôi tin cậy nơi Ngài, và Ngài giúp đỡ tôi.",
    scripture_vi: "Hãy cảm tạ trong mọi hoàn cảnh; vì đó là ý muốn của Đức Chúa Trời cho anh em trong Đức Chúa Giê-xu Christ.",
    scripture_vi: "Tôi sẽ nằm xuống bình an và ngủ, vì chỉ một mình Ngài, lạy Đức Giê-hô-va, cho tôi ở yên ổn.",
    scripture_vi: "Hãy cảm tạ Đức Giê-hô-va, vì Ngài là tốt lành; sự nhân từ Ngài còn đến đời đời.",
    scripture_vi: "Ngài ban giấc ngủ cho kẻ Ngài yêu dấu.",
    scripture_vi: "Đấng gìn giữ ngươi sẽ không buồn ngủ. Đức Giê-hô-va gìn giữ ngươi — Đức Giê-hô-va là bóng che ở bên phải ngươi.",
    reference: "Psalm 118:24",
    prayer: "Heavenly Father, thank You for this new day. As the sun rises, let Your love rise in our hearts. Guide our steps today, give us strength for every task, and help us be a blessing to those we meet. In Jesus' name, Amen.",
    prayer_zh: "天父，感谢祢赐下新的一天。当太阳升起时，愿祢的爱也在我们心中升起。引导我们今天的脚步，赐我们力量完成每一件事，帮助我们成为别人的祝福。奉耶稣的名祷告，阿们。",
    prayer_vi: "Lạy Cha trên trời, cảm ơn Ngài vì ngày mới. Khi mặt trời mọc, xin tình yêu Ngài cũng dấy lên trong lòng chúng con. Xin hướng dẫn bước đi của con hôm nay, ban sức lực cho mọi công việc, và giúp con trở thành phước lành cho người con gặp. Nhân danh Chúa Giê-xu, A-men.",
    prayer_vi: "Lạy Chúa Giê-xu, khi con bắt đầu ngày mới, xin lấp đầy con bằng sức Ngài. Khi con yếu đuối, xin nhắc con rằng quyền năng Ngài nên trọn vẹn trong sự yếu đuối. Xin giúp con nương cậy Ngài trong mọi sự. A-men.",
    prayer_vi: "Lạy Đức Chúa Trời của mọi sự an ủi, sự thương xót Ngài mới mẻ sáng nay. Xin rửa sạch lo lắng ngày hôm qua và lấp đầy con bằng hy vọng cho hôm nay. A-men.",
    prayer_vi: "Lạy Chúa, vào giờ trưa này con dừng lại để nhớ đến Ngài. Xin làm mới lại sức con cho buổi chiều phía trước.",
    prayer_vi: "Lạy Cha trên trời, khi mặt trời lên cao, xin thêm sức cho con cho những gì ở phía trước.",
    prayer_vi: "Lạy Chúa, con dừng lại để cảm tạ vì hơi thở, thức ăn, và những người trong đời con.",
    prayer_vi: "Lạy Chúa, khi ngày hôm nay kết thúc, con trao mọi lo lắng vào tay Ngài. Cảm ơn Ngài đã đồng hành cùng con hôm nay. Xin ban cho con giấc ngủ bình an tối nay. A-men.",
    prayer_vi: "Lạy Cha, khi mặt trời lặn, con dâng lời tạ ơn. Vì mỗi sự tử tế nhận được, mỗi bữa ăn chia sẻ, mỗi khoảnh khắc tươi đẹp — cảm ơn Ngài. Xin đưa con qua đêm nay. A-men.",
    prayer_vi: "Lạy Cha trên trời, khi con nhắm mắt tối nay, con tin cậy Ngài mọi điều. Xin làm yên lặng tâm trí con, bình an tấm lòng con, và cho thiên sứ Ngài canh giữ con. Cảm ơn Ngài vì ngày sống hôm nay. Con nghỉ ngơi trong tình yêu Ngài. A-men.",
    prayer_vi: "Lạy Chúa, Ngài không bao giờ ngủ hay mệt mỏi. Khi con nằm xuống tối nay, con biết Ngài đang canh giữ. Xin bảo vệ nhà con, gia đình con, và tất cả những người yếu đuối tối nay. A-men.",
    reflection: "Each morning is a gift from God. No matter what yesterday held, today is fresh and full of His mercies.",
    reflection_zh: "每个早晨都是上帝的恩赐。无论昨天如何，今天都是崭新的，满有祂的怜悯。",
    reflection_vi: "Mỗi buổi sáng là một món quà từ Đức Chúa Trời. Dù hôm qua thế nào, hôm nay tươi mới và đầy lòng thương xót của Ngài.",
    reflection_vi: "Đức Chúa Trời không hứa những ngày dễ dàng, nhưng Ngài hứa sự hiện diện của Ngài trong mọi khoảnh khắc.",
    reflection_vi: "Như mặt trời trung tín mọc mỗi ngày, tình yêu của Đức Chúa Trời dành cho bạn không bao giờ dao động.",
    reflection_vi: "Đức Chúa Trời mời gọi chúng ta nghỉ ngơi — không chỉ ban đêm, mà ngay giữa ngày bận rộn.",
    reflection_vi: "Giữa trưa là ngã rẽ — hãy tin cậy Đức Chúa Trời cho cả hai nửa của ngày.",
    reflection_vi: "Lòng biết ơn biến những khoảnh khắc bình thường thành thánh thiêng.",
    reflection_vi: "Ngày đã qua. Điều gì chưa hoàn thành, Đức Chúa Trời nắm giữ. Sự nghỉ ngơi của bạn không phải kiếm được — đó là món quà.",
    reflection_vi: "Trước khi ngủ, hãy kể ba điều bạn biết ơn hôm nay.",
    reflection_vi: "Đức Chúa Trời không bao giờ ngủ. Khi bạn nghỉ, Ngài canh giữ. Bạn được ôm ấp suốt đêm.",
    reflection_vi: "Bạn có thể ngủ vì Đức Chúa Trời đang thức. Sự canh giữ của Ngài không bao giờ kết thúc.",
    hymn: "Great Is Thy Faithfulness", hymn_vi: "Sự thành tín của Chúa thật lớn lao", hymn_vi: "Xin Chúa làm khải tượng của con", hymn_vi: "Buổi sáng đã rạng đông", hymn_vi: "Xin ở cùng con", hymn_vi: "Giờ đây chúng con cảm tạ Chúa", hymn_vi: "Suốt đêm trường", hymn_vi: "Linh hồn ơi hãy an tĩnh", hymn_zh: "祢的信实广大",
  },
  {
    type: "morning", title: "Strength for Today", title_vi: "Sức mạnh cho hôm nay", title_zh: "今日的力量", title_th: "กำลังสำหรับวันนี้", title_ko: "오늘의 힘", title_ja: "今日の力",
    scripture: "I can do all things through Christ who strengthens me.",
    scripture_zh: "我靠着那加给我力量的，凡事都能做。",
    scripture_th: "ข้าพเจ้าทำทุกสิ่งได้โดยพระคริสต์ผู้ทรงเสริมกำลังข้าพเจ้า",
    scripture_ko: "내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라",
    scripture_ja: "私を強くしてくださる方によって、私はどんなことでもできるのです。",
    reference: "Philippians 4:13",
    prayer: "Lord Jesus, as I begin this day, fill me with Your strength. When I feel weak, remind me that Your power is made perfect in weakness. Help me to rely on You in all things. Amen.",
    prayer_zh: "主耶稣，当我开始新的一天，求祢以力量充满我。当我软弱时，提醒我祢的能力在人的软弱上显得完全。帮助我凡事依靠祢。阿们。",
    reflection: "God does not promise us easy days, but He promises His presence in every moment.",
    reflection_zh: "上帝没有应许我们轻松的日子，但祂应许每一刻都与我们同在。",
    hymn: "Be Thou My Vision", hymn_zh: "求主作我异象",
  },
  {
    type: "morning", title: "New Mercies", title_vi: "Sự thương xót mới", title_zh: "新的怜悯", title_th: "พระกรุณาใหม่", title_ko: "새 긍휼", title_ja: "新しいあわれみ",
    scripture: "Because of the LORD's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
    scripture_zh: "我们不致消灭，是出于耶和华诸般的慈爱，是因祂的怜悯不致断绝。每早晨这都是新的。祢的诚实极其广大！",
    scripture_th: "เราไม่ถูกทำลาย เพราะความรักมั่นคงของพระเจ้าไม่มีวันสิ้นสุด พระกรุณาของพระองค์ใหม่ทุกเช้า ความสัตย์ซื่อของพระองค์ยิ่งใหญ่",
    scripture_ko: "여호와의 인자와 긍휼이 무궁하시도다 이것들이 아침마다 새로우니 주의 성실하심이 크시도다",
    scripture_ja: "私たちが絶え果てなかったのは主の恵みによる。主のあわれみは朝ごとに新しい。あなたの真実は偉大です。",
    reference: "Lamentations 3:22-23",
    prayer: "God of all comfort, Your mercies are new this morning. Wash away yesterday's worries and fill me with hope for today. Let me walk in Your grace and share it with others. Amen.",
    prayer_zh: "赐一切安慰的神，祢的怜悯今早是新的。洗去昨天的忧虑，用盼望充满我的今天。让我行在祢的恩典中，并与他人分享。阿们。",
    reflection: "Like the sunrise that comes faithfully each day, God's love for you never wavers.",
    reflection_zh: "如同每日忠实升起的太阳，上帝对你的爱永不动摇。",
    hymn: "Morning Has Broken", hymn_zh: "清晨破晓",
  },
];


const noonPrayers: Devotional[] = [
  { type: "noon", title: "Midday Rest", title_zh: "午间安息", title_th: "พักกลางวัน", title_ko: "낮 안식", title_ja: "昼の休息",
    scripture: "Come to me, all you who are weary and burdened, and I will give you rest.",
    scripture_zh: "凡劳苦担重担的人，可以到我这里来，我就使你们得安息。",
    scripture_th: "บรรดาผู้เหน็ดเหนื่อยและแบกภาระหนัก จงมาหาเรา เราจะให้ท่านได้หยุดพัก",
    scripture_ko: "수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라",
    scripture_ja: "すべて疲れた人、重荷を負っている人はわたしのもとに来なさい。わたしがあなたがたを休ませてあげます。",
    reference: "Matthew 11:28", prayer: "Lord, at this midday hour I pause to remember You. Renew my strength for the afternoon ahead.", reflection: "God invites us to rest — not just at night, but in the middle of our busy day." },
  { type: "noon", title: "Noonday Strength", title_zh: "午间力量", title_th: "พลังเที่ยงวัน", title_ko: "한낮의 힘", title_ja: "正午の力",
    scripture: "The LORD is my strength and my shield; my heart trusts in him, and he helps me.",
    scripture_zh: "耶和华是我的力量，是我的盾牌，我心里倚靠他，就得帮助。",
    scripture_th: "พระเจ้าทรงเป็นกำลังและโล่ของข้าพเจ้า ใจข้าพเจ้าวางใจพระองค์",
    scripture_ko: "여호와는 나의 힘과 나의 방패시니 내 마음이 그를 의지하여 도움을 얻었도다",
    scripture_ja: "主は私の力、私の盾。私の心は主に拠り頼み、私は助けられた。",
    reference: "Psalm 28:7", prayer: "Heavenly Father, as the sun is high, strengthen me for what lies ahead.", reflection: "Midday is a crossroads — trust God for both halves of the day." },
  { type: "noon", title: "Grateful Pause", title_zh: "感恩停歇", title_th: "หยุดขอบคุณ", title_ko: "감사의 멈춤", title_ja: "感謝の一時停止",
    scripture: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
    scripture_zh: "凡事谢恩，因为这是神在基督耶稣里向你们所定的旨意。",
    scripture_th: "จงขอบพระคุณในทุกกรณี เพราะนี่คือพระประสงค์ของพระเจ้า",
    scripture_ko: "범사에 감사하라 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라",
    scripture_ja: "すべてのことについて感謝しなさい。これが、キリスト・イエスにあって神があなたがたに望んでおられることです。",
    reference: "1 Thessalonians 5:18", prayer: "Lord, I pause to give thanks for breath, food, and the people in my life.", reflection: "Gratitude transforms ordinary moments into holy ones." },
];


const afternoonPrayers: Devotional[] = [
  {
    type: "afternoon", title: "Afternoon Strength", title_zh: "午后力量", title_zh_tw: "午後力量", title_th: "พลังยามบ่าย", title_ko: "오후의 힘", title_ja: "午後の力", title_vi: "Sức mạnh buổi chiều",
    scripture: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
    scripture_zh: "但那等候耶和华的，必重新得力。他们必如鹰展翅上腾，他们奔跑却不困倦，行走却不疲乏。",
    scripture_zh_tw: "但那等候耶和華的，必重新得力。他們必如鷹展翅上騰，他們奔跑卻不困倦，行走卻不疲乏。",
    scripture_th: "แต่ผู้ที่รอคอยพระเจ้าจะได้รับกำลังใหม่ เขาจะบินขึ้นด้วยปีกเหมือนนกอินทรี จะวิ่งและไม่เหน็ดเหนื่อย จะเดินและไม่อ่อนเพลีย",
    scripture_ko: "오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요 달음박질하여도 곤비하지 아니하겠고 걸어가도 피곤하지 아니하리로다",
    scripture_ja: "しかし主を待ち望む者は新しく力を得、鷲のように翼を広げて上ることができる。走っても疲れず、歩いても弱ることがない。",
    scripture_vi: "Nhưng ai trông đợi Đức Giê-hô-va sẽ được sức mới, bay lên như đại bàng; chạy mà không mệt nhọc, đi mà không mòn mỏi.",
    reference: "Isaiah 40:31",
    prayer: "Lord, the afternoon stretches ahead. Renew my energy and focus. Help me finish today's tasks with grace. Give me patience with myself and others. In Your strength I press on. Amen.",
    prayer_zh: "主啊，下午还很长。更新我的精力和专注力。帮助我以恩典完成今天的任务。赐我对自己和他人的耐心。靠着祢的力量我继续前行。阿们。",
    prayer_zh_tw: "主啊，下午還很長。更新我的精力和專注力。幫助我以恩典完成今天的任務。賜我對自己和他人的耐心。靠著祢的力量我繼續前行。阿們。",
    prayer_th: "พระเจ้า บ่ายนี้ยังยาวไกล โปรดฟื้นฟูพลังและสมาธิของข้าพระองค์ ช่วยให้ทำงานวันนี้สำเร็จด้วยพระคุณ โปรดให้ความอดทนกับตนเองและผู้อื่น ข้าพระองค์ก้าวไปในพระกำลังของพระองค์ อาเมน",
    prayer_ko: "주님, 오후가 펼쳐져 있습니다. 제 에너지와 집중력을 새롭게 하소서. 오늘의 일을 은혜로 마칠 수 있게 도와주소서. 저와 다른 사람들에게 인내를 주소서. 주의 힘으로 나아갑니다. 아멘",
    prayer_ja: "主よ、午後が続きます。私の力と集中力を新たにしてください。今日の仕事を恵みのうちに終えられるように。自分にも他者にも忍耐を与えてください。あなたの力で前進します。アーメン",
    prayer_vi: "Lạy Chúa, buổi chiều còn dài phía trước. Xin đổi mới sức lực và sự tập trung của con. Giúp con hoàn thành công việc hôm nay trong ân điển. Ban cho con sự kiên nhẫn với bản thân và người khác. Con tiến bước trong sức Chúa. A-men.",
    reflection: "The afternoon slump is real — but God's strength has no slump. Lean into Him.",
    reflection_zh: "下午的疲倦是真实的——但上帝的力量从不减退。靠近祂。",
    reflection_zh_tw: "下午的疲倦是真實的——但上帝的力量從不減退。靠近祂。",
    reflection_th: "ความอ่อนล้าในยามบ่ายมีจริง แต่กำลังของพระเจ้าไม่เคยตกต่ำ จงพึ่งพาพระองค์",
    reflection_ko: "오후의 나른함은 واقعی지만 하나님의 힘은 결코 약해지지 않습니다. 주님께 기대십시오.",
    reflection_ja: "午後のだるさは本当です。しかし神の力に落ち込みはありません。主に寄りかかってください。",
    reflection_vi: "Sự mệt mỏi buổi chiều là có thật — nhưng sức mạnh của Đức Chúa Trời không bao giờ suy giảm. Hãy nương cậy Ngài.",
    hymn: "Leaning on the Everlasting Arms", hymn_zh: "靠主永远膀臂", hymn_zh_tw: "靠主永遠膀臂", hymn_th: "วางใจในพระกรนิรันดร์", hymn_ko: "주의 영원한 팔에 안기세", hymn_ja: "主の永遠の腕にもたれて", hymn_vi: "Nương cậy cánh tay đời đời",
  },
  {
    type: "afternoon", title: "Sustaining Grace", title_zh: "托住的恩典", title_zh_tw: "托住的恩典", title_th: "พระคุณที่ค้ำจุน", title_ko: "붙드시는 은혜", title_ja: "支える恵み", title_vi: "Ân điển nâng đỡ",
    scripture: "The LORD upholds all who fall and lifts up all who are bowed down.",
    scripture_zh: "凡跌倒的，耶和华将他们扶持；凡被压下的，将他们扶起。",
    scripture_zh_tw: "凡跌倒的，耶和華將他們扶持；凡被壓下的，將他們扶起。",
    scripture_th: "พระเจ้าทรงค้ำจุนทุกคนที่ล้ม และทรงยกทุกคนที่ก้มลงให้ลุกขึ้น",
    scripture_ko: "여호와께서 넘어지는 모든 자를 붙드시며 구부러진 모든 자를 펴 세우시는도다",
    scripture_ja: "主はすべて倒れる者を支え、すべてかがむ者を起こされます。",
    scripture_vi: "Đức Giê-hô-va nâng đỡ mọi người ngã, và dựng lại mọi người bị còng lưng.",
    reference: "Psalm 145:14",
    prayer: "Gracious God, if this afternoon feels heavy, carry me. Sustain me through the rest of this day. I trust that You are working even when I cannot see it. Amen.",
    prayer_zh: "慈爱的上帝，如果今天下午感觉沉重，请托住我。支撑我度过这天余下的时光。我相信即使我看不见，祢仍在做工。阿们。",
    prayer_zh_tw: "慈愛的上帝，如果今天下午感覺沉重，請托住我。支撐我度過這天餘下的時光。我相信即使我看不見，祢仍在做工。阿們。",
    prayer_th: "พระเจ้าผู้ทรงพระกรุณา หากบ่ายนี้รู้สึกหนักอึ้ง โปรดแบกรับข้าพระองค์ โปรดค้ำจุนข้าพระองค์ตลอดวันที่เหลือ ข้าพระองค์วางใจว่าพระองค์ทรงทำงานแม้เมื่อมองไม่เห็น อาเมน",
    prayer_ko: "은혜로운 하나님, 오후가 무겁게 느껴지면 저를 안아주소서. 남은 하루를 붙들어주소서. 보이지 않아도 역사하고 계심을 믿습니다. 아멘",
    prayer_ja: "恵み深い神よ、もし今日の午後が重く感じるなら、私を支えてください。残りの一日を支えてください。見えなくても働いておられることを信頼します。アーメン",
    prayer_vi: "Lạy Đức Chúa Trời đầy ân điển, nếu buổi chiều nay cảm thấy nặng nề, xin nâng đỡ con. Xin gìn giữ con trong phần còn lại của ngày hôm nay. Con tin rằng Ngài đang hành động dù con không thấy. A-men.",
    reflection: "God sustains you in the quiet, unremarkable hours just as much as the dramatic ones.",
    reflection_zh: "上帝在平静无奇的时刻支撑你，就像在戏剧性的时刻一样。",
    reflection_zh_tw: "上帝在平靜無奇的時刻支撐你，就像在戲劇性的時刻一樣。",
    reflection_th: "พระเจ้าทรงค้ำจุนคุณในชั่วโมงเงียบสงบธรรมดา ไม่ต่างจากช่วงเวลาสำคัญยิ่ง",
    reflection_ko: "하나님은 극적인 순간뿐 아니라 조용하고 평범한 시간에도 당신을 붙드십니다.",
    reflection_ja: "神は劇的な時だけでなく、静かで何気ない時間にもあなたを支えておられます。",
    reflection_vi: "Đức Chúa Trời nâng đỡ bạn trong những giờ phút yên lặng, bình thường cũng như trong những lúc kịch tính.",
    hymn: "He Leadeth Me", hymn_zh: "主引导我", hymn_zh_tw: "主引導我", hymn_th: "พระองค์ทรงนำข้า", hymn_ko: "주 인도하심", hymn_ja: "主はわれを導く", hymn_vi: "Ngài dẫn dắt tôi",
  },
  {
    type: "afternoon", title: "Peace in the Wait", title_zh: "等候中的平安", title_zh_tw: "等候中的平安", title_th: "สันติสุขในการรอคอย", title_ko: "기다림 속 평안", title_ja: "待つことの中の平安", title_vi: "Bình an trong sự chờ đợi",
    scripture: "Be still before the LORD and wait patiently for him.",
    scripture_zh: "你当默然倚靠耶和华，耐性等候他。",
    scripture_zh_tw: "你當默然倚靠耶和華，耐性等候他。",
    scripture_th: "จงสงบนิ่งต่อพระเจ้า และรอคอยพระองค์อย่างอดทน",
    scripture_ko: "여호와 앞에 잠잠하고 참고 기다리라",
    scripture_ja: "主の前に静まり、耐え忍んで主を待て。",
    scripture_vi: "Hãy yên lặng trước mặt Đức Giê-hô-va, và kiên nhẫn chờ đợi Ngài.",
    reference: "Psalm 37:7",
    prayer: "Lord, in these afternoon hours, help me find peace. Not everything needs to be finished today. Teach me to rest in Your timing. I release my anxieties to You now. Amen.",
    prayer_zh: "主啊，在这下午的时光，帮助我找到平安。不是所有事都需要今天完成。教导我安息在祢的时间表里。我现在将我的焦虑交给祢。阿们。",
    prayer_zh_tw: "主啊，在這下午的時光，幫助我找到平安。不是所有事都需要今天完成。教導我安息在祢的時間表裡。我現在將我的焦慮交給祢。阿們。",
    prayer_th: "พระเจ้า ในช่วงบ่ายนี้ โปรดช่วยให้ข้าพระองค์พบสันติสุข ไม่ใช่ทุกอย่างต้องเสร็จวันนี้ สอนข้าพระองค์ให้พักในเวลาของพระองค์ ข้าพระองค์มอบความกังวลแด่พระองค์ อาเมน",
    prayer_ko: "주님, 이 오후 시간에 평안을 찾게 도와주소서. 모든 것을 오늘 끝낼 필요는 없습니다. 주의 때에 쉬는 것을 가르쳐 주소서. 이제 제 염려를 주께 맡깁니다. 아멘",
    prayer_ja: "主よ、午後のこの時間に平安を見出させてください。すべてを今日終える必要はありません。あなたのタイミングの中で休むことを教えてください。今、不安をあなたに委ねます。アーメン",
    prayer_vi: "Lạy Chúa, trong những giờ chiều này, xin giúp con tìm được bình an. Không phải mọi thứ đều cần hoàn thành hôm nay. Xin dạy con nghỉ ngơi trong thời điểm của Ngài. Con trao mọi lo lắng cho Ngài. A-men.",
    reflection: "The afternoon is God's reminder that not everything is urgent. Some things need time to grow.",
    reflection_zh: "下午是上帝的提醒：不是所有事都紧急。有些事需要时间成长。",
    reflection_zh_tw: "下午是上帝的提醒：不是所有事都緊急。有些事需要時間成長。",
    reflection_th: "ช่วงบ่ายเป็นเครื่องเตือนใจจากพระเจ้าว่า ไม่ใช่ทุกสิ่งจะเร่งด่วน บางอย่างต้องใช้เวลาเติบโต",
    reflection_ko: "오후는 모든 일이 다 급한 것은 아니라는 하나님의 상기입니다. 어떤 것은 자라는 데 시간이 필요합니다.",
    reflection_ja: "午後は、すべてが緊急ではないことを思い出させる神からのしるしです。成長に時間が必要なものもあります。",
    reflection_vi: "Buổi chiều là lời nhắc của Đức Chúa Trời rằng không phải mọi điều đều cấp bách. Có những điều cần thời gian để lớn lên.",
    hymn: "It Is Well with My Soul", hymn_zh: "我心灵得安宁", hymn_zh_tw: "我心靈得安寧", hymn_th: "เป็นสุขในจิตวิญญาณ", hymn_ko: "내 영혼 평안해", hymn_ja: "わが魂は安らかなり", hymn_vi: "Bình an cho linh hồn tôi",
  },
];


const mealPrayers: Devotional[] = [
  { type: "meal", title: "Grace Before Meals", title_zh: "饭前感恩", title_th: "อธิษฐานก่อนอาหาร", title_ko: "식사 기도", title_ja: "食前の祈り",
    scripture: "He took bread, gave thanks and broke it, and gave it to them.",
    scripture_zh: "又拿起饼来，祝谢了，就擘开，递给他们。",
    scripture_th: "แล้วพระองค์ทรงหยิบขนมปัง ขอบพระคุณ หักออก แล้วส่งให้เขา",
    scripture_ko: "또 떡을 가져 감사 기도하시고 떼어 그들에게 주시며",
    scripture_ja: "それからパンを取り、感謝をささげてから裂き、弟子たちに与えて言われた。",
    reference: "Luke 22:19", prayer: "Heavenly Father, we thank You for this food. Bless it to nourish our bodies. May we always remember those who have less. Amen.", reflection: "Every meal is a gift. Jesus gave thanks before breaking bread." },
  { type: "meal", title: "Daily Bread", title_zh: "日用的饮食", title_th: "อาหารประจำวัน", title_ko: "일용할 양식", title_ja: "日ごとの糧",
    scripture: "Give us today our daily bread.",
    scripture_zh: "我们日用的饮食，今日赐给我们。",
    scripture_th: "ขอประทานอาหารประจำวันแก่ข้าพระองค์ในวันนี้",
    scripture_ko: "오늘 우리에게 일용할 양식을 주시옵고",
    scripture_ja: "私たちの日ごとの糧を、きょうもお与えください。",
    reference: "Matthew 6:11", prayer: "Lord, You provide all we need. Thank You for this daily bread. Help us share generously with others.", reflection: "Jesus taught us to ask for daily bread — trust God one day at a time." },
  { type: "meal", title: "The Lord Provides", title_zh: "主必预备", title_th: "พระเจ้าทรงจัดเตรียม", title_ko: "여호와 이레", title_ja: "主が備えてくださる",
    scripture: "The eyes of all look to you, and you give them their food at the proper time.",
    scripture_zh: "万民都举目仰望你，你随时给他们食物。",
    scripture_th: "ตาของทุกคนเพ่งดูพระองค์ และพระองค์ประทานอาหารแก่เขาตามเวลา",
    scripture_ko: "만물이 주를 앙망하오니 주께서 때를 따라 그들에게 먹을 것을 주시며",
    scripture_ja: "すべてのものの目はあなたを待ち望んでいます。あなたは時にかなって彼らに食物を与えられます。",
    reference: "Psalm 145:15", prayer: "Gracious God, You feed all creatures in due season. We are grateful for this meal. Bless those who prepared it. Amen.", reflection: "God feeds the birds, clothes the lilies, and provides for you." },
  { type: "meal", title: "Fellowship at Table", title_zh: "餐桌团契", title_th: "สามัคคีธรรมที่โต๊ะอาหาร", title_ko: "식탁의 교제", title_ja: "食卓の交わり",
    scripture: "They broke bread in their homes and ate together with glad and sincere hearts.",
    scripture_zh: "他们在家中擘饼，存着欢喜诚实的心用饭。",
    scripture_th: "เขาหักขนมปังตามบ้านของเขา รับประทานอาหารด้วยความชื่นชมยินดี",
    scripture_ko: "집에서 떡을 떼며 기쁨과 순전한 마음으로 음식을 먹고",
    scripture_ja: "家でパンを裂き、喜びと真心をもって食事をともにし",
    reference: "Acts 2:46", prayer: "Lord Jesus, You ate with sinners and saints alike. Bless this table. May our fellowship reflect Your love.", reflection: "Meals are sacred moments of connection and community." },
];

const eveningPrayers: Devotional[] = [
  {
    type: "evening", title: "Evening Rest", title_vi: "Nghỉ ngơi buổi tối", title_zh: "晚间安息", title_th: "พักผ่อนยามเย็น", title_ko: "저녁 안식", title_ja: "夕べの安らぎ",
    scripture: "In peace I will lie down and sleep, for you alone, LORD, make me dwell in safety.",
    scripture_zh: "我必安然躺下睡觉，因为独有祢耶和华使我安然居住。",
    scripture_th: "ข้าพเจ้าจะนอนลงอย่างสงบและหลับไป เพราะพระองค์ผู้เดียวทรงให้ข้าพเจ้าอยู่อย่างปลอดภัย",
    scripture_ko: "내가 평안히 눕고 자리니 나를 안전히 살게 하시는 이는 오직 여호와이시니이다",
    scripture_ja: "平安のうちに私は横になり眠ります。主よ、あなただけが私を安全に住まわせてくださいます。",
    reference: "Psalm 4:8",
    prayer: "Lord, as this day ends, I release all worries into Your hands. Thank You for walking with me today. Grant me peaceful rest tonight. Watch over my loved ones as we sleep. Amen.",
    prayer_zh: "主啊，当这一天结束时，我将所有忧虑交在祢手中。感谢祢今天与我同行。赐我今夜平安的安息。看顾我的家人。阿们。",
    prayer_th: "พระเจ้า เมื่อวันนี้สิ้นสุดลง ข้าพระองค์มอบความกังวลทั้งหมดไว้ในพระหัตถ์ ขอบคุณที่ทรงเดินไปด้วยกันวันนี้ โปรดประทานการพักผ่อนอย่างสงบในคืนนี้ อาเมน",
    prayer_ko: "주님, 오늘 하루가 끝나갈 때 모든 걱정을 주님께 맡깁니다. 오늘도 함께해주셔서 감사합니다. 평안한 밤 되게 하소서. 아멘",
    prayer_ja: "主よ、今日が終わるとき、すべての心配をあなたの手に委ねます。今日も共に歩んでくださり感謝します。今夜平安な眠りをお与えください。アーメン",
    reflection: "The day is done. Whatever was left undone, God holds it. Your rest is not earned — it is a gift.",
    reflection_zh: "一天结束了。未完成的事，上帝掌管。你的安息不是赚来的——是恩赐。",
    hymn: "Abide with Me", hymn_zh: "与主同住",
  },
  {
    type: "evening", title: "Gratitude at Dusk", title_vi: "Lòng biết ơn lúc hoàng hôn", title_zh: "黄昏感恩", title_th: "ขอบคุณยามเย็น", title_ko: "저녁 감사", title_ja: "夕暮れの感謝",
    scripture: "Give thanks to the LORD, for he is good; his love endures forever.",
    scripture_zh: "你们要称谢耶和华，因祂本为善，祂的慈爱永远长存。",
    scripture_th: "จงขอบพระคุณพระเจ้า เพราะพระองค์ทรงดี ความรักมั่นคงของพระองค์ดำรงนิรันดร์",
    scripture_ko: "여호와께 감사하라 그는 선하시며 그 인자하심이 영원함이로다",
    scripture_ja: "主に感謝せよ。主はまことにいつくしみ深い。その恵みはとこしえまで。",
    reference: "Psalm 107:1",
    prayer: "Father, as the sun sets, I give thanks. For every kindness received, every meal shared, every moment of beauty — thank You. Carry me through the night. Amen.",
    prayer_zh: "父啊，当太阳落下，我献上感恩。为每一份善意、每一顿饭、每一刻的美好——感谢祢。带领我度过今夜。阿们。",
    prayer_th: "พระบิดา เมื่อพระอาทิตย์ตกดิน ข้าพระองค์ขอบพระคุณ สำหรับทุกความเมตตา ทุกมื้ออาหาร ทุกช่วงเวลาแห่งความงดงาม ขอบคุณพระองค์ อาเมน",
    prayer_ko: "아버지, 해가 질 때 감사드립니다. 받은 모든 친절, 나눈 모든 식사, 아름다운 모든 순간에 감사합니다. 밤새 지켜주소서. 아멘",
    prayer_ja: "父よ、日が沈むとき感謝いたします。受けたすべての親切、分かち合った食事、美しい瞬間に感謝します。今夜もお守りください。アーメン",
    reflection: "Before sleep, name three things you are grateful for today.",
    reflection_zh: "入睡前，说出今天你感恩的三件事。",
    hymn: "Now Thank We All Our God", hymn_zh: "齐来谢主恩",
  },
  {
    type: "evening", title: "Bedtime Peace", title_vi: "Bình an trước khi ngủ", title_zh: "睡前平安", title_th: "สันติสุขก่อนนอน", title_ko: "잠자리 평안", title_ja: "就寝の平安",
    scripture: "He gives his beloved sleep.",
    scripture_zh: "祂赐给祂所亲爱的人安睡。",
    scripture_th: "พระองค์ประทานการนอนหลับแก่ผู้ที่พระองค์ทรงรัก",
    scripture_ko: "그가 그의 사랑하시는 자에게 잠을 주시는도다",
    scripture_ja: "主は愛する者に眠りを与えてくださる。",
    reference: "Psalm 127:2",
    prayer: "Heavenly Father, as I close my eyes tonight, I trust You with everything. Quiet my mind, calm my heart, and let Your angels watch over me. Thank You for this day of life. I rest in Your love. Amen.",
    prayer_zh: "天父，当我今夜闭上眼睛，我将一切交托给祢。安静我的心思，平静我的心灵，让祢的天使看顾我。感谢祢赐我今天的生命。我在祢的爱中安息。阿们。",
    prayer_th: "พระบิดาบนสวรรค์ เมื่อข้าพระองค์หลับตาในคืนนี้ ข้าพระองค์วางใจในพระองค์ทุกสิ่ง โปรดให้จิตใจสงบ ให้ทูตสวรรค์คอยดูแล ขอบคุณสำหรับวันนี้ ข้าพระองค์พักผ่อนในความรักของพระองค์ อาเมน",
    prayer_ko: "하늘 아버지, 오늘 밤 눈을 감으며 모든 것을 주님께 맡깁니다. 마음을 고요하게 하시고 천사들로 지켜주소서. 오늘 하루의 생명에 감사합니다. 주의 사랑 안에서 쉽니다. 아멘",
    prayer_ja: "天の父よ、今夜目を閉じるとき、すべてをあなたに委ねます。心を静め、御使いたちに守らせてください。今日の命に感謝します。あなたの愛の中で休みます。アーメン",
    reflection: "God never sleeps. As you rest, He watches. You are held through the night.",
    reflection_zh: "上帝从不打盹。你安息时，祂看顾你。祂整夜托住你。",
    hymn: "All Through the Night", hymn_zh: "整夜看顾",
  },
  {
    type: "evening", title: "Night Watch", title_vi: "Canh giữ ban đêm", title_zh: "夜间守望", title_th: "ยามค่ำคืน", title_ko: "밤의 파수", title_ja: "夜の見守り",
    scripture: "He who watches over you will not slumber. The LORD watches over you — the LORD is your shade at your right hand.",
    scripture_zh: "保护你的必不打盹。耶和华是你的保护，在你右边荫庇你。",
    scripture_th: "พระองค์ผู้ทรงดูแลท่านจะไม่เคยหลับ พระเจ้าทรงคุ้มครองท่าน ทรงเป็นร่มเงาอยู่ข้างขวาของท่าน",
    scripture_ko: "너를 지키시는 이가 졸지 아니하시리로다 여호와는 너를 지키시는 이시라 네 오른쪽에서 네 그늘이 되시나니",
    scripture_ja: "あなたを守る方はまどろむこともない。主はあなたを守る方。あなたの右の手をおおう陰。",
    reference: "Psalm 121:3-5",
    prayer: "Lord, You never sleep and never tire. As I lay down tonight, I know You are watching. Protect my home, my family, and all who are vulnerable tonight. Amen.",
    prayer_zh: "主啊，祢从不打盹，也不疲倦。当我今夜躺下，我知道祢在看顾。保护我的家、我的家人，和今夜所有脆弱的人。阿们。",
    prayer_th: "พระเจ้า พระองค์ไม่เคยหลับหรือเหนื่อย เมื่อข้าพระองค์นอนลงคืนนี้ ข้าพระองค์รู้ว่าพระองค์ทรงเฝ้าดู โปรดปกป้องบ้าน ครอบครัว และผู้ที่อ่อนแอในคืนนี้ อาเมน",
    prayer_ko: "주님, 주무시지도 피곤하지도 않으십니다. 오늘 밤 누울 때 주님이 지켜보고 계심을 압니다. 제 집과 가족, 연약한 모든 이를 보호해주소서. 아멘",
    prayer_ja: "主よ、あなたはまどろむことも疲れることもありません。今夜横たわるとき、あなたが見守っておられることを知っています。我が家と家族、弱い方々をお守りください。アーメン",
    reflection: "You can sleep because God is awake. His watch never ends.",
    reflection_zh: "你能安睡，因为上帝醒着。祂的看顾永不停止。",
    hymn: "Be Still My Soul", hymn_zh: "我心安宁",
  },
];


const sundayPrayers: Devotional[] = [
  {
    type: "sunday", title: "The Lord's Day", title_zh: "主日",
    scripture: "For where two or three gather in my name, there am I with them.",
    scripture_zh: "因为无论在哪里，有两三个人奉我的名聚会，那里就有我在他们中间。",
    reference: "Matthew 18:20",
    prayer: "Lord of the Sabbath, we gather to worship You. Whether in a cathedral or a living room, You are present. Open our hearts to hear Your Word. Amen.",
    prayer_zh: "安息日的主，我们聚集敬拜祢。无论在大教堂还是客厅，祢都在场。打开我们的心领受祢的话语。阿们。",
    reflection: "Sunday is set apart — not as a burden, but as a gift. A day to rest and reconnect with God.",
    reflection_zh: "主日是分别出来的——不是负担，而是恩赐。一个休息并与上帝重新连接的日子。",
    hymn: "Holy, Holy, Holy", hymn_zh: "圣哉三一",
  },
  {
    type: "sunday", title: "Community of Faith", title_zh: "信仰群体",
    scripture: "Let us not give up meeting together, as some are in the habit of doing, but let us encourage one another.",
    scripture_zh: "你们不可停止聚会，好像那些停止惯了的人，倒要彼此劝勉。",
    title_th: "ชุมชนแห่งศรัทธา",
    title_ko: "신앙 공동체",
    title_ja: "信仰の共同体",
    scripture_th: "อย่าขาดจากการประชุมกัน ดังที่บางคนเคยทำ แต่จงหนุนใจกันและกัน",
    scripture_ko: "모이기를 폐하는 어떤 사람들의 습관과 같이 하지 말고 오직 권하여",
    scripture_ja: "ある人たちのように、集まることをやめてはいけません。むしろ励まし合いましょう。",
    reference: "Hebrews 10:25",
    prayer: "God of community, bless Your church today. Unite believers. Help us love one another as You loved us. Amen.",
    prayer_zh: "群体的上帝，今天赐福祢的教会。使信徒合一。帮助我们彼此相爱，如同祢爱了我们。阿们。",
    reflection: "The Church is not a building — it is people. You are part of God's family worldwide.",
    reflection_zh: "教会不是建筑——是人。你是上帝全球家庭的一部分。",
    hymn: "Blessed Be the Tie That Binds", hymn_zh: "我们成为一家人",
  },
];

const holidayPrayers: Record<string, Devotional> = {
  christmas_eve: {
    type: "holiday", title: "Christmas Eve — The Light Comes", title_zh: "平安夜——真光来到",
    scripture: "For to us a child is born, to us a son is given, and the government will be on his shoulders. And he will be called Wonderful Counsellor, Mighty God, Everlasting Father, Prince of Peace.",
    scripture_zh: "因有一婴孩为我们而生，有一子赐给我们，政权必担在他的肩头上。他名称为奇妙策士、全能的神、永在的父、和平的君。",
    reference: "Isaiah 9:6",
    prayer: "O Holy God, on this blessed eve, we await the celebration of Your Son's birth. The Light of the World came as a baby — humble, tender, Emmanuel. Fill our hearts with wonder. In Jesus' name, Amen.",
    prayer_zh: "圣洁的上帝，在这蒙福的夜晚，我们等候庆祝祢儿子的降生。世界的光以婴孩的样式来到——谦卑、温柔、以马内利。用惊奇充满我们的心。奉耶稣的名祷告，阿们。",
    reflection: "Tonight the world holds its breath. God chose the darkest night to bring the greatest light.",
    reflection_zh: "今夜世界屏息以待。上帝选择在最黑暗的夜晚带来最伟大的光。",
    hymn: "Silent Night", hymn_zh: "平安夜",
  },
  christmas: {
    type: "holiday", title: "Christmas Day — God With Us", title_zh: "圣诞节——以马内利",
    scripture: "The Word became flesh and made his dwelling among us. We have seen his glory, the glory of the one and only Son, who came from the Father, full of grace and truth.",
    scripture_zh: "道成了肉身，住在我们中间，充充满满地有恩典有真理。我们也见过他的荣光，正是父独生子的荣光。",
    reference: "John 1:14",
    prayer: "Almighty God, today we celebrate the Incarnation. You loved us so much that You entered our world. Thank You for Jesus. May His love overflow to everyone we meet. Merry Christmas, Lord. Amen.",
    prayer_zh: "全能的上帝，今天我们庆祝道成肉身。祢如此爱我们，亲自进入我们的世界。感谢祢赐下耶稣。愿祂的爱满溢到我们遇见的每个人。主啊，圣诞快乐。阿们。",
    reflection: "Christmas is not about perfection — it is about Presence. God is WITH us. Emmanuel.",
    reflection_zh: "圣诞节不是关于完美——是关于同在。上帝与我们同在。以马内利。",
    hymn: "Joy to the World", hymn_zh: "普世欢腾",
  },
  ash_wednesday: {
    type: "holiday", title: "Ash Wednesday — Return to the Lord", title_zh: "圣灰星期三——归向主",
    scripture: "Yet even now, declares the LORD, return to me with all your heart, with fasting, with weeping, and with mourning; and rend your hearts and not your garments.",
    scripture_zh: "耶和华说：虽然如此，你们应当禁食、哭泣、悲哀，一心归向我。你们要撕裂心肠，不撕裂衣服，归向耶和华你们的神。",
    reference: "Joel 2:12-13",
    prayer: "Merciful God, as we begin this season of Lent, search our hearts. Show us where we have wandered. Draw us back to You. Create in us a clean heart, O God. In humility we pray, Amen.",
    prayer_zh: "怜悯的上帝，当我们进入大斋期，求祢鉴察我们的心。指出我们偏行的地方。将我们拉回祢身边。上帝啊，求祢为我造清洁的心。我们谦卑祷告，阿们。",
    reflection: "Lent is 40 days of honest reflection. Not punishment — invitation. God invites you closer.",
    reflection_zh: "大斋期是四十天诚实的反思。不是惩罚——是邀请。上帝邀请你更靠近祂。",
    hymn: "Create in Me a Clean Heart", hymn_zh: "求主为我造清洁的心",
  },
  good_friday: {
    type: "holiday", title: "Good Friday — The Cross", title_zh: "受难节——十字架",
    scripture: "But he was pierced for our transgressions, he was crushed for our iniquities; the punishment that brought us peace was on him, and by his wounds we are healed.",
    scripture_zh: "哪知他为我们的过犯受害，为我们的罪孽压伤。因他受的刑罚我们得平安，因他受的鞭伤我们得医治。",
    reference: "Isaiah 53:5",
    prayer: "Lord Jesus, today we stand at the foot of Your cross. We are silent before such love. You bore our sin so we might live. We receive this grace with trembling gratitude. Thank You. Amen.",
    prayer_zh: "主耶稣，今天我们站在祢十字架下。面对如此大爱，我们无言以对。祢承担我们的罪，使我们得以存活。我们以颤抖的感恩接受这恩典。感谢祢。阿们。",
    reflection: "Today we remember the cost of love. The cross is not the end — but it is the heart of the story.",
    reflection_zh: "今天我们纪念爱的代价。十字架不是结局——但它是故事的核心。",
    hymn: "When I Survey the Wondrous Cross", hymn_zh: "每逢思想奇妙十架",
  },
  easter: {
    type: "holiday", title: "Easter Sunday — He Is Risen!", title_zh: "复活节——主已复活！",
    scripture: "He is not here; he has risen, just as he said. Come and see the place where he lay.",
    scripture_zh: "他不在这里，照他所说的，已经复活了。你们来看安放主的地方。",
    reference: "Matthew 28:6",
    prayer: "Risen Lord! Death could not hold You. The grave is empty and we are free! Fill us with resurrection joy. Because You live, we live also. Hallelujah! Amen.",
    prayer_zh: "复活的主！死亡不能拘禁祢。坟墓空了，我们自由了！用复活的喜乐充满我们。因为祢活着，我们也活着。哈利路亚！阿们。",
    reflection: "The resurrection is not a metaphor — it is history. Jesus is alive, and every promise stands firm.",
    reflection_zh: "复活不是比喻——是历史。耶稣活着，祂的每一个应许都坚定不移。",
    hymn: "Christ the Lord Is Risen Today", hymn_zh: "基督今日已复活",
  },
  ascension: {
    type: "holiday", title: "Ascension Day — The King Returns", title_zh: "升天节——君王升天",
    scripture: "After he said this, he was taken up before their very eyes, and a cloud hid him from their sight.",
    scripture_zh: "说了这话，他们正看的时候，他就被取上升，有一朵云彩把他接去，便看不见他了。",
    reference: "Acts 1:9",
    prayer: "Ascended King, You reign at the Father's right hand, interceding for us. Though we cannot see You, we trust You are working all things for good. Come, Lord Jesus. Amen.",
    prayer_zh: "升天的君王，祢在父的右边掌权，为我们代求。虽然我们看不见祢，我们相信祢使万事互相效力。主耶稣，请来。阿们。",
    reflection: "Jesus ascended — but He did not abandon. He sent the Spirit, and He will return.",
    reflection_zh: "耶稣升天了——但祂没有撇下我们。祂差遣了圣灵，而且祂还要再来。",
    hymn: "Crown Him with Many Crowns", hymn_zh: "万冠之冠归祂戴",
  },
  pentecost: {
    type: "holiday", title: "Pentecost — The Spirit Comes", title_zh: "五旬节——圣灵降临",
    scripture: "But you will receive power when the Holy Spirit comes on you; and you will be my witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth.",
    scripture_zh: "但圣灵降临在你们身上，你们就必得着能力，并要在耶路撒冷、犹太全地和撒玛利亚，直到地极，作我的见证。",
    reference: "Acts 1:8",
    prayer: "Holy Spirit, come afresh today. Fill Your church with power and boldness. Give us words to speak and love to share. Set us on fire for Your glory. Amen.",
    prayer_zh: "圣灵，今天重新充满我们。以能力和胆量充满祢的教会。赐我们当说的话和要分享的爱。为祢的荣耀点燃我们。阿们。",
    reflection: "The Spirit is God's presence living IN you. You carry resurrection power.",
    reflection_zh: "圣灵是住在你里面的上帝的同在。你承载着复活的大能。",
    hymn: "Come, Holy Spirit", hymn_zh: "圣灵请来",
  },
  all_saints: {
    type: "holiday", title: "All Saints' Day — A Great Cloud of Witnesses", title_zh: "诸圣日——如云的见证人",
    scripture: "Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles, and let us run with perseverance the race marked out for us.",
    scripture_zh: "我们既有这许多的见证人，如同云彩围着我们，就当放下各样的重担，脱去容易缠累我们的罪，存心忍耐，奔那摆在我们前头的路程。",
    reference: "Hebrews 12:1",
    prayer: "God of all ages, we thank You for the faithful who have gone before us. Their lives inspire ours. Help us run our race with the same perseverance, fixing our eyes on Jesus. Amen.",
    prayer_zh: "万代的上帝，我们感谢祢，为那些在我们前面忠心的人。他们的生命激励我们。帮助我们以同样的忍耐奔跑，定睛仰望耶稣。阿们。",
    reflection: "You are not alone in your faith. Generations before you trusted the same God. Their stories are your heritage.",
    reflection_zh: "你的信仰之路并不孤单。在你之前的世代信靠同一位上帝。他们的故事是你的传承。",
    hymn: "For All the Saints", hymn_zh: "万圣颂歌",
  },
  palm_sunday: {
    type: "holiday", title: "Palm Sunday — Hosanna!", title_zh: "棕枝主日——和散那！",
    scripture: "Blessed is he who comes in the name of the Lord! Hosanna in the highest heaven!",
    scripture_zh: "奉主名来的是应当称颂的！高高在上和散那！",
    reference: "Matthew 21:9",
    prayer: "King Jesus, You entered Jerusalem humbly on a donkey, yet the crowds rightly cried Hosanna — Save us! Today we join them. Save us, Lord. You are our King. Amen.",
    prayer_zh: "君王耶稣，祢谦卑地骑驴进入耶路撒冷，然而众人正确地呼喊和散那——拯救我们！今天我们加入他们。主啊，拯救我们。祢是我们的王。阿们。",
    reflection: "Palm Sunday begins Holy Week — the most sacred days of the Christian year.",
    reflection_zh: "棕枝主日开启了受难周——基督教年历中最神圣的日子。",
    hymn: "All Glory, Laud, and Honor", hymn_zh: "荣耀归主名",
  },
  advent_1: {
    type: "holiday", title: "First Sunday of Advent — Hope", title_zh: "将临期第一主日——盼望",
    scripture: "The people walking in darkness have seen a great light; on those living in the land of deep darkness a light has dawned.",
    scripture_zh: "在黑暗中行走的百姓看见了大光；住在死荫之地的人有光照耀他们。",
    reference: "Isaiah 9:2",
    prayer: "God of Hope, as we light the first Advent candle, we look forward to the coming of Your Son. In a world of darkness, You sent Light. Renew our hope today. Amen.",
    prayer_zh: "盼望的上帝，当我们点燃第一支将临期蜡烛，我们期待祢儿子的到来。在黑暗的世界中，祢差遣了光。今天更新我们的盼望。阿们。",
    reflection: "Advent means 'coming.' We wait — not in anxiety, but in anticipation. Hope is coming.",
    reflection_zh: "将临期意为'来临'。我们等待——不是焦虑，而是期盼。盼望正在来临。",
    hymn: "O Come, O Come, Emmanuel", hymn_zh: "以马内利来临歌",
  },
};

function getDevotionalForDate(date: Date, requestedType?: string): Devotional {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dow = date.getDay();
  const aestHour = (date.getUTCHours() + 10) % 24;

  if (requestedType === "morning") return morningPrayers[d % morningPrayers.length];
  if (requestedType === "noon") return noonPrayers[d % noonPrayers.length];
  if (requestedType === "afternoon") return afternoonPrayers[d % afternoonPrayers.length];
  if (requestedType === "evening") return eveningPrayers[d % eveningPrayers.length];
  if (requestedType === "meal") return mealPrayers[d % mealPrayers.length];
  if (requestedType === "sunday") return sundayPrayers[d % sundayPrayers.length];

  if (m === 12 && d === 24) return holidayPrayers["christmas_eve"];
  if (m === 12 && d === 25) return holidayPrayers["christmas"];
  if (m === 11 && d === 1) return holidayPrayers["all_saints"];

  if (dow === 0) return sundayPrayers[d % sundayPrayers.length];
  if (aestHour >= 5 && aestHour < 11) return morningPrayers[d % morningPrayers.length];
  if (aestHour >= 11 && aestHour < 14) return noonPrayers[d % noonPrayers.length];
  if (aestHour >= 14 && aestHour < 17) return afternoonPrayers[d % afternoonPrayers.length];
  return eveningPrayers[d % eveningPrayers.length];
}

/**
 * GET /api/devotional?type=morning|evening|sunday&holiday=christmas_eve&lang=zh
 */

// Bible book name translations
const BIBLE_BOOKS: Record<string, Record<string, string>> = {
  "Genesis": { zh: "创世记", zh_tw: "創世記", th: "ปฐมกาล", ko: "창세기", ja: "創世記", vi: "Sáng thế" },
  "Exodus": { zh: "出埃及记", zh_tw: "出埃及記", th: "อพยพ", ko: "출애굽기", ja: "出エジプト記", vi: "Xuất hành" },
  "Leviticus": { zh: "利未记", zh_tw: "利未記", th: "เลวีนิติ", ko: "레위기", ja: "レビ記", vi: "Lê-vi" },
  "Numbers": { zh: "民数记", zh_tw: "民數記", th: "กันดารวิถี", ko: "민수기", ja: "民数記", vi: "Dân số" },
  "Deuteronomy": { zh: "申命记", zh_tw: "申命記", th: "เฉลยธรรมบัญญัติ", ko: "신명기", ja: "申命記", vi: "Phục truyền" },
  "Joshua": { zh: "约书亚记", zh_tw: "約書亞記", th: "โยชูวา", ko: "여호수아", ja: "ヨシュア記", vi: "Giô-suê" },
  "Judges": { zh: "士师记", zh_tw: "士師記", th: "ผู้วินิจฉัย", ko: "사사기", ja: "士師記", vi: "Các quan xét" },
  "Ruth": { zh: "路得记", zh_tw: "路得記", th: "นางรูธ", ko: "룻기", ja: "ルツ記", vi: "Ru-tơ" },
  "1 Samuel": { zh: "撒母耳记上", zh_tw: "撒母耳記上", th: "1 ซามูเอล", ko: "사무엘상", ja: "サムエル記上", vi: "1 Sa-mu-ên" },
  "2 Samuel": { zh: "撒母耳记下", zh_tw: "撒母耳記下", th: "2 ซามูเอล", ko: "사무엘하", ja: "サムエル記下", vi: "2 Sa-mu-ên" },
  "1 Kings": { zh: "列王纪上", zh_tw: "列王紀上", th: "1 พงศ์กษัตริย์", ko: "열왕기상", ja: "列王記上", vi: "1 Các vua" },
  "2 Kings": { zh: "列王纪下", zh_tw: "列王紀下", th: "2 พงศ์กษัตริย์", ko: "열왕기하", ja: "列王記下", vi: "2 Các vua" },
  "1 Chronicles": { zh: "历代志上", zh_tw: "歷代志上", th: "1 พงศาวดาร", ko: "역대상", ja: "歴代誌上", vi: "1 Sử ký" },
  "2 Chronicles": { zh: "历代志下", zh_tw: "歷代志下", th: "2 พงศาวดาร", ko: "역대하", ja: "歴代誌下", vi: "2 Sử ký" },
  "Ezra": { zh: "以斯拉记", zh_tw: "以斯拉記", th: "เอสรา", ko: "에스라", ja: "エズラ記", vi: "E-xơ-ra" },
  "Nehemiah": { zh: "尼希米记", zh_tw: "尼希米記", th: "เนหะมีย์", ko: "느헤미야", ja: "ネヘミヤ記", vi: "Nê-hê-mi" },
  "Esther": { zh: "以斯帖记", zh_tw: "以斯帖記", th: "เอสเธอร์", ko: "에스더", ja: "エステル記", vi: "Ê-xơ-tê" },
  "Job": { zh: "约伯记", zh_tw: "約伯記", th: "โยบ", ko: "욥기", ja: "ヨブ記", vi: "Gióp" },
  "Psalm": { zh: "诗篇", zh_tw: "詩篇", th: "สดุดี", ko: "시편", ja: "詩篇", vi: "Thi thiên" },
  "Psalms": { zh: "诗篇", zh_tw: "詩篇", th: "สดุดี", ko: "시편", ja: "詩篇", vi: "Thi thiên" },
  "Proverbs": { zh: "箴言", zh_tw: "箴言", th: "สุภาษิต", ko: "잠언", ja: "箴言", vi: "Châm ngôn" },
  "Ecclesiastes": { zh: "传道书", zh_tw: "傳道書", th: "ปัญญาจารย์", ko: "전도서", ja: "伝道者の書", vi: "Truyền đạo" },
  "Song of Solomon": { zh: "雅歌", zh_tw: "雅歌", th: "เพลงซาโลมอน", ko: "아가", ja: "雅歌", vi: "Nhã ca" },
  "Isaiah": { zh: "以赛亚书", zh_tw: "以賽亞書", th: "อิสยาห์", ko: "이사야", ja: "イザヤ書", vi: "Ê-sai" },
  "Jeremiah": { zh: "耶利米书", zh_tw: "耶利米書", th: "เยเรมีย์", ko: "예레미야", ja: "エレミヤ書", vi: "Giê-rê-mi" },
  "Lamentations": { zh: "耶利米哀歌", zh_tw: "耶利米哀歌", th: "เพลงคร่ำครวญ", ko: "예레미야애가", ja: "哀歌", vi: "Ca thương" },
  "Ezekiel": { zh: "以西结书", zh_tw: "以西結書", th: "เอเสเคียล", ko: "에스겔", ja: "エゼキエル書", vi: "Ê-xê-chi-ên" },
  "Daniel": { zh: "但以理书", zh_tw: "但以理書", th: "ดาเนียล", ko: "다니엘", ja: "ダニエル書", vi: "Đa-ni-ên" },
  "Hosea": { zh: "何西阿书", zh_tw: "何西阿書", th: "โฮเชยา", ko: "호세아", ja: "ホセア書", vi: "Ô-sê" },
  "Joel": { zh: "约珥书", zh_tw: "約珥書", th: "โยเอล", ko: "요엘", ja: "ヨエル書", vi: "Giô-ên" },
  "Amos": { zh: "阿摩司书", zh_tw: "阿摩司書", th: "อาโมส", ko: "아모스", ja: "アモス書", vi: "A-mốt" },
  "Micah": { zh: "弥迦书", zh_tw: "彌迦書", th: "มีคาห์", ko: "미가", ja: "ミカ書", vi: "Mi-chê" },
  "Habakkuk": { zh: "哈巴谷书", zh_tw: "哈巴谷書", th: "ฮาบากุก", ko: "하박국", ja: "ハバクク書", vi: "Ha-ba-cúc" },
  "Zephaniah": { zh: "西番雅书", zh_tw: "西番雅書", th: "เศฟันยาห์", ko: "스바냐", ja: "ゼパニヤ書", vi: "Sô-phô-ni" },
  "Zechariah": { zh: "撒迦利亚书", zh_tw: "撒迦利亞書", th: "เศคาริยาห์", ko: "스가랴", ja: "ゼカリヤ書", vi: "Xa-cha-ri" },
  "Malachi": { zh: "玛拉基书", zh_tw: "瑪拉基書", th: "มาลาคี", ko: "말라기", ja: "マラキ書", vi: "Ma-la-chi" },
  "Matthew": { zh: "马太福音", zh_tw: "馬太福音", th: "มัทธิว", ko: "마태복음", ja: "マタイの福音書", vi: "Ma-thi-ơ" },
  "Mark": { zh: "马可福音", zh_tw: "馬可福音", th: "มาระโก", ko: "마가복음", ja: "マルコの福音書", vi: "Mác" },
  "Luke": { zh: "路加福音", zh_tw: "路加福音", th: "ลูกา", ko: "누가복음", ja: "ルカの福音書", vi: "Lu-ca" },
  "John": { zh: "约翰福音", zh_tw: "約翰福音", th: "ยอห์น", ko: "요한복음", ja: "ヨハネの福音書", vi: "Giăng" },
  "Acts": { zh: "使徒行传", zh_tw: "使徒行傳", th: "กิจการ", ko: "사도행전", ja: "使徒の働き", vi: "Công vụ" },
  "Romans": { zh: "罗马书", zh_tw: "羅馬書", th: "โรม", ko: "로마서", ja: "ローマ人への手紙", vi: "Rô-ma" },
  "1 Corinthians": { zh: "哥林多前书", zh_tw: "哥林多前書", th: "1 โครินธ์", ko: "고린도전서", ja: "コリント人への手紙第一", vi: "1 Cô-rinh-tô" },
  "2 Corinthians": { zh: "哥林多后书", zh_tw: "哥林多後書", th: "2 โครินธ์", ko: "고린도후서", ja: "コリント人への手紙第二", vi: "2 Cô-rinh-tô" },
  "Galatians": { zh: "加拉太书", zh_tw: "加拉太書", th: "กาลาเทีย", ko: "갈라디아서", ja: "ガラテヤ人への手紙", vi: "Ga-la-ti" },
  "Ephesians": { zh: "以弗所书", zh_tw: "以弗所書", th: "เอเฟซัส", ko: "에베소서", ja: "エペソ人への手紙", vi: "Ê-phê-sô" },
  "Philippians": { zh: "腓立比书", zh_tw: "腓立比書", th: "ฟีลิปปี", ko: "빌립보서", ja: "ピリピ人への手紙", vi: "Phi-líp" },
  "Colossians": { zh: "歌罗西书", zh_tw: "歌羅西書", th: "โคโลสี", ko: "골로새서", ja: "コロサイ人への手紙", vi: "Cô-lô-se" },
  "1 Thessalonians": { zh: "帖撒罗尼迦前书", zh_tw: "帖撒羅尼迦前書", th: "1 เธสะโลนิกา", ko: "데살로니가전서", ja: "テサロニケ人への手紙第一", vi: "1 Tê-sa-lô-ni-ca" },
  "2 Thessalonians": { zh: "帖撒罗尼迦后书", zh_tw: "帖撒羅尼迦後書", th: "2 เธสะโลนิกา", ko: "데살로니가후서", ja: "テサロニケ人への手紙第二", vi: "2 Tê-sa-lô-ni-ca" },
  "1 Timothy": { zh: "提摩太前书", zh_tw: "提摩太前書", th: "1 ทิโมธี", ko: "디모데전서", ja: "テモテへの手紙第一", vi: "1 Ti-mô-thê" },
  "2 Timothy": { zh: "提摩太后书", zh_tw: "提摩太後書", th: "2 ทิโมธี", ko: "디모데후서", ja: "テモテへの手紙第二", vi: "2 Ti-mô-thê" },
  "Titus": { zh: "提多书", zh_tw: "提多書", th: "ทิตัส", ko: "디도서", ja: "テトスへの手紙", vi: "Tít" },
  "Philemon": { zh: "腓利门书", zh_tw: "腓利門書", th: "ฟีเลโมน", ko: "빌레몬서", ja: "ピレモンへの手紙", vi: "Phi-lê-môn" },
  "Hebrews": { zh: "希伯来书", zh_tw: "希伯來書", th: "ฮีบรู", ko: "히브리서", ja: "ヘブル人への手紙", vi: "Hê-bơ-rơ" },
  "James": { zh: "雅各书", zh_tw: "雅各書", th: "ยากอบ", ko: "야고보서", ja: "ヤコブの手紙", vi: "Gia-cơ" },
  "1 Peter": { zh: "彼得前书", zh_tw: "彼得前書", th: "1 เปโตร", ko: "베드로전서", ja: "ペテロの手紙第一", vi: "1 Phi-e-rơ" },
  "2 Peter": { zh: "彼得后书", zh_tw: "彼得後書", th: "2 เปโตร", ko: "베드로후서", ja: "ペテロの手紙第二", vi: "2 Phi-e-rơ" },
  "1 John": { zh: "约翰一书", zh_tw: "約翰一書", th: "1 ยอห์น", ko: "요한일서", ja: "ヨハネの手紙第一", vi: "1 Giăng" },
  "2 John": { zh: "约翰二书", zh_tw: "約翰二書", th: "2 ยอห์น", ko: "요한이서", ja: "ヨハネの手紙第二", vi: "2 Giăng" },
  "3 John": { zh: "约翰三书", zh_tw: "約翰三書", th: "3 ยอห์น", ko: "요한삼서", ja: "ヨハネの手紙第三", vi: "3 Giăng" },
  "Jude": { zh: "犹大书", zh_tw: "猶大書", th: "ยูดา", ko: "유다서", ja: "ユダの手紙", vi: "Giu-đe" },
  "Revelation": { zh: "启示录", zh_tw: "啟示錄", th: "วิวรณ์", ko: "요한계시록", ja: "ヨハネの黙示録", vi: "Khải huyền" },
};

function translateReference(ref: string, lang: string): string {
  if (lang === "en") return ref;
  // Parse "Book Name Chapter:Verse" or "Book Name Chapter:V1-V2"
  const match = ref.match(/^(.+?)\s+(\d+.*)$/);
  if (!match) return ref;
  const [, bookName, versePart] = match;
  const translated = BIBLE_BOOKS[bookName]?.[lang] || BIBLE_BOOKS[bookName]?.["zh"] || bookName;
  return translated + " " + versePart;
}


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || undefined;
  const holiday = searchParams.get("holiday") || undefined;
  const lang = searchParams.get("lang") || "en";
  // Force Australia/Sydney timezone (Vercel runs UTC)
  const now = new Date(); // UTC — getDevotionalForDate adds +10h for AEST internally

  let devotional: Devotional;
  if (holiday && holidayPrayers[holiday]) {
    devotional = holidayPrayers[holiday];
  } else {
    devotional = getDevotionalForDate(now, type);
  }

  // Format response based on language
  const response: any = {
    success: true,
    lang,
    date: now.toISOString(),
    dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()],
    season: getLiturgicalSeason(now),
    availableHolidays: Object.keys(holidayPrayers),
  };

  // Multi-language devotional content
  const langKey = lang.startsWith("zh") ? "zh" : lang; // zh_tw uses zh content
  const getField = (en: string, field: string) => {
    const localized = (devotional as Record<string, string>)[field + "_" + langKey];
    if (localized) return localized;
    // Fallback: zh for zh_tw, then en
    if (langKey !== "zh") {
      const zhFallback = (devotional as Record<string, string>)[field + "_zh"];
      if (lang === "zh_tw" && zhFallback) return zhFallback;
    }
    return en;
  };

  response.devotional = {
    type: devotional.type,
    title: getField(devotional.title, "title"),
    scripture: getField(devotional.scripture, "scripture"),
    reference: translateReference(devotional.reference, lang),
    prayer: getField(devotional.prayer, "prayer"),
    reflection: getField(devotional.reflection, "reflection"),
    hymn: getField(devotional.hymn || "", "hymn"),
  };

  return NextResponse.json(response);
}
