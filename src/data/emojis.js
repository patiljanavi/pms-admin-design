// Emojis for the text editor: picker categories + shortcodes (type :code: in the editor).
const E = (char, code, name) => ({ char, code, name });

export const EMOJI_CATEGORIES = [
  { id: 'smileys', label: 'Smileys', icon: '😀', items: [
    E('😀', 'grinning', 'grinning face'), E('😃', 'smiley', 'smiling face'), E('😄', 'smile', 'smile'), E('😁', 'grin', 'grin'),
    E('😆', 'laughing', 'laughing'), E('😅', 'sweat_smile', 'sweat smile'), E('😂', 'joy', 'tears of joy'), E('🙂', 'slight_smile', 'slight smile'),
    E('😉', 'wink', 'wink'), E('😊', 'blush', 'blush'), E('😇', 'innocent', 'halo'), E('😍', 'heart_eyes', 'heart eyes'),
    E('🤩', 'star_struck', 'star struck'), E('😘', 'kiss', 'kiss'), E('😋', 'yum', 'yum'), E('😎', 'sunglasses', 'cool'),
    E('🤓', 'nerd', 'nerd'), E('🤔', 'thinking', 'thinking'), E('🤨', 'raised_eyebrow', 'raised eyebrow'), E('😐', 'neutral', 'neutral'),
    E('😴', 'sleeping', 'sleeping'), E('😮', 'open_mouth', 'surprised'), E('😢', 'cry', 'crying'), E('😭', 'sob', 'sobbing'),
    E('😤', 'triumph', 'huffing'), E('😡', 'rage', 'angry'), E('🤯', 'exploding_head', 'mind blown'), E('🥳', 'partying', 'party face'),
    E('😬', 'grimacing', 'grimacing'), E('🙄', 'eye_roll', 'eye roll'), E('🤗', 'hugs', 'hug'), E('🫡', 'salute', 'salute'),
  ] },
  { id: 'people', label: 'People & gestures', icon: '👍', items: [
    E('👍', 'thumbsup', 'thumbs up'), E('👎', 'thumbsdown', 'thumbs down'), E('👏', 'clap', 'clapping'), E('🙌', 'raised_hands', 'raised hands'),
    E('🙏', 'pray', 'please thank you'), E('🤝', 'handshake', 'handshake'), E('👋', 'wave', 'wave hello'), E('✌️', 'v', 'victory'),
    E('🤞', 'crossed_fingers', 'fingers crossed'), E('👌', 'ok_hand', 'ok hand'), E('💪', 'muscle', 'strong'), E('👉', 'point_right', 'point right'),
    E('👀', 'eyes', 'eyes look'), E('🧠', 'brain', 'brain'), E('🙋', 'raising_hand', 'raising hand'), E('🤷', 'shrug', 'shrug'),
    E('👨‍💼', 'man_office', 'office worker'), E('👩‍💼', 'woman_office', 'office worker'), E('👥', 'people', 'people team'), E('🧑‍💻', 'technologist', 'developer'),
  ] },
  { id: 'nature', label: 'Nature', icon: '🌿', items: [
    E('🌞', 'sun', 'sun'), E('🌙', 'moon', 'moon'), E('⭐', 'star', 'star'), E('🌟', 'star2', 'glowing star'),
    E('⚡', 'zap', 'lightning'), E('🔥', 'fire', 'fire'), E('🌈', 'rainbow', 'rainbow'), E('☔', 'umbrella', 'rain'),
    E('❄️', 'snowflake', 'snow'), E('🌱', 'seedling', 'seedling growth'), E('🌿', 'herb', 'herb'), E('🌸', 'cherry_blossom', 'flower'),
    E('🌍', 'earth', 'earth world'), E('🐶', 'dog', 'dog'), E('🐱', 'cat', 'cat'), E('🦄', 'unicorn', 'unicorn'),
  ] },
  { id: 'food', label: 'Food & drink', icon: '☕', items: [
    E('☕', 'coffee', 'coffee'), E('🍵', 'tea', 'tea'), E('🍕', 'pizza', 'pizza'), E('🍔', 'hamburger', 'burger'),
    E('🍰', 'cake', 'cake'), E('🎂', 'birthday', 'birthday cake'), E('🍎', 'apple', 'apple'), E('🍪', 'cookie', 'cookie'),
    E('🥗', 'salad', 'salad'), E('🍾', 'champagne', 'champagne celebrate'), E('🥂', 'cheers', 'cheers toast'), E('🍩', 'doughnut', 'donut'),
  ] },
  { id: 'activities', label: 'Activities', icon: '🎉', items: [
    E('🎉', 'tada', 'party celebration'), E('🎊', 'confetti', 'confetti'), E('🎈', 'balloon', 'balloon'), E('🎁', 'gift', 'gift present'),
    E('🏆', 'trophy', 'trophy win'), E('🥇', 'first_place', 'gold medal'), E('🎯', 'dart', 'target goal'), E('🚀', 'rocket', 'rocket launch'),
    E('🏁', 'checkered_flag', 'finish'), E('🎮', 'video_game', 'game'), E('⚽', 'soccer', 'football'), E('🎵', 'music', 'music'),
  ] },
  { id: 'objects', label: 'Work & objects', icon: '💼', items: [
    E('💼', 'briefcase', 'briefcase work'), E('📁', 'file_folder', 'folder'), E('📂', 'open_folder', 'open folder'), E('📄', 'page', 'document page'),
    E('📝', 'memo', 'memo note'), E('📋', 'clipboard', 'clipboard'), E('📌', 'pushpin', 'pin'), E('📎', 'paperclip', 'attachment'),
    E('📅', 'date', 'calendar date'), E('🗓️', 'calendar', 'calendar'), E('⏰', 'alarm_clock', 'alarm deadline'), E('⏳', 'hourglass', 'waiting'),
    E('📧', 'email', 'email'), E('📞', 'phone', 'phone call'), E('💬', 'speech', 'message chat'), E('📢', 'loudspeaker', 'announcement'),
    E('💰', 'moneybag', 'money'), E('💵', 'dollar', 'dollar cash'), E('💳', 'credit_card', 'card payment'), E('🧾', 'receipt', 'receipt invoice'),
    E('📈', 'chart_up', 'growth chart'), E('📉', 'chart_down', 'decline chart'), E('📊', 'bar_chart', 'report chart'), E('🧮', 'abacus', 'calculate'),
    E('🔒', 'lock', 'lock secure'), E('🔑', 'key', 'key'), E('💡', 'bulb', 'idea'), E('🔍', 'mag', 'search'),
    E('✏️', 'pencil', 'edit'), E('🖊️', 'pen', 'sign pen'), E('💻', 'computer', 'laptop'), E('🏦', 'bank', 'bank'),
  ] },
  { id: 'symbols', label: 'Symbols', icon: '✅', items: [
    E('✅', 'white_check_mark', 'done check'), E('☑️', 'ballot_box_with_check', 'checkbox'), E('✔️', 'heavy_check_mark', 'check'), E('❌', 'x', 'cross no'),
    E('⚠️', 'warning', 'warning'), E('❗', 'exclamation', 'important'), E('❓', 'question', 'question'), E('ℹ️', 'information', 'info'),
    E('🔴', 'red_circle', 'red'), E('🟠', 'orange_circle', 'orange'), E('🟡', 'yellow_circle', 'yellow'), E('🟢', 'green_circle', 'green'),
    E('🔵', 'blue_circle', 'blue'), E('⭕', 'o', 'circle'), E('❤️', 'heart', 'love heart'), E('💯', '100', 'hundred perfect'),
    E('➡️', 'arrow_right', 'arrow right'), E('⬆️', 'arrow_up', 'arrow up'), E('🔄', 'repeat', 'recurring repeat'), E('🆕', 'new', 'new'),
  ] },
];

export const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap((c) => c.items);
export const EMOJI_BY_CODE = Object.fromEntries(ALL_EMOJIS.map((e) => [e.code, e]));