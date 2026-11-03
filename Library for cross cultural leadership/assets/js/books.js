(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     Scroll proximity
     The module starts become gentle snap points. Proximity (not
     mandatory) keeps the middle of every long section free to scroll.
  ------------------------------------------------------------------ */
  if (document.body.classList.contains("book-page")) {
    document.documentElement.classList.add("book-snap");
    $$("main > header, main > section").forEach((section) => {
      if (section.offsetHeight > 260) section.classList.add("snap-point");
    });
  }

  /* ------------------------------------------------------------------
     Page reveal
  ------------------------------------------------------------------ */
  const revealItems = $$("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.06 }
    );
    revealItems.forEach((item, index) => {
      if (!item.style.getPropertyValue("--reveal-delay")) {
        item.style.setProperty("--reveal-delay", `${Math.min(index * 55, 280)}ms`);
      }
      observer.observe(item);
    });
  }

  /* ------------------------------------------------------------------
     Checklists — deliberately ephemeral. Refresh clears them.
  ------------------------------------------------------------------ */
  const initChecklist = (form) => {
    const boxes = $$('input[type="checkbox"]', form);
    const fill = $(".action-fill", form);
    const count = $(".action-count", form);
    const reset = $("[data-check-reset]", form);
    form.setAttribute("autocomplete", "off");

    const update = () => {
      const checked = boxes.filter((box) => box.checked).length;
      if (fill) fill.style.width = `${(checked / boxes.length) * 100}%`;
      if (count) count.textContent = `${checked} / ${boxes.length}`;
      form.classList.toggle("is-complete", checked === boxes.length);
    };

    const clear = () => {
      boxes.forEach((box) => {
        box.checked = false;
      });
      update();
    };

    boxes.forEach((box) => box.addEventListener("change", update));
    if (reset) reset.addEventListener("click", clear);
    clear();
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) clear();
    });
  };

  $$("[data-fresh]").forEach(initChecklist);

  /* ------------------------------------------------------------------
     01 · 五事庙算
  ------------------------------------------------------------------ */
  const initFiveFactors = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const defaults = { dao: 1, tian: 1, di: 1, jiang: 1, fa: 1 };
    const state = { ...defaults };
    const factors = {
      dao: {
        label: "道 · 共同目标",
        quote: "“上下同欲者胜。”",
        advice: [
          "尚未同欲：目标不一致时，投入越多，分歧越贵。先停下资源，把“为何而战”谈清楚。",
          "目标有交集，但还没有共同承诺。让关键参与者自己说出“成功是什么”。",
          "上下同欲，具备认真谈投入与节奏的基础。"
        ]
      },
      tian: {
        label: "天 · 外部时机",
        quote: "“天者，阴阳、寒暑、时制也。”",
        advice: [
          "逆着周期出手，执行力越强，消耗越快。先判断这是不是属于你的窗口。",
          "窗口并不明朗，但可以等待。把等待变成准备，而不是焦虑。",
          "外部时机顺风。顺风时更要留退路，因为风向会变。"
        ]
      },
      di: {
        label: "地 · 场景地形",
        quote: "“知天知地，胜乃可全。”",
        advice: [
          "地形生疏。别把总部的常识当成当地的现实；先进入现场，再谈扩张。",
          "地形可以探明。用小规模试验换取真实知识，不要用一份报告替代脚。",
          "熟悉地形。优势在于选择战场，而不是在每个战场都开战。"
        ]
      },
      jiang: {
        label: "将 · 能力品格",
        quote: "“将者，智、信、仁、勇、严也。”",
        advice: [
          "主将薄弱时，最好的战略也会被执行成事故。先换人、补人，或缩小目标。",
          "能力可用，但还需要明确授权与边界。不要在开战后才发现谁在指挥。",
          "将能任事。记得让判断权靠近现场，而不是集中在一个人身上。"
        ]
      },
      fa: {
        label: "法 · 规则执行",
        quote: "“法者，曲制、官道、主用也。”",
        advice: [
          "失序会让组织在压力下散架。先约定谁决定、谁负责、何时复盘。",
          "规则已成形，但还未成为习惯。用一次真实演练验证它。",
          "有法可依。注意别让流程僵化到无法应对变化。"
        ]
      }
    };
    const order = ["dao", "tian", "di", "jiang", "fa"];

    const scoreEl = $("[data-factors-score]", root);
    const verdictEl = $("[data-factors-verdict]", root);
    const weakestEl = $("[data-factors-weakest]", root);
    const adviceEl = $("[data-factors-advice]", root);
    const quoteEl = $("[data-factors-quote]", root);
    const liveEl = $("[data-factors-live]", root);
    const reset = $("[data-factors-reset]", root);

    const verdict = (total) => {
      if (total <= 2) return "未战先败之形：现在开战，只是在测试运气。";
      if (total <= 4) return "不可战：先为不可胜，补最短的那块板。";
      if (total <= 6) return "条件未明：先补“不可胜”，不要急着开战。";
      if (total <= 8) return "可战：底盘成形，但仍要先补最短一处。";
      return "时机趋近：仍须等对手暴露“可胜”，而不是自信开战。";
    };

    const render = () => {
      const total = order.reduce((sum, key) => sum + state[key], 0);
      if (scoreEl) scoreEl.textContent = String(total).padStart(2, "0");
      if (verdictEl) verdictEl.textContent = verdict(total);

      order.forEach((key) => {
        const bar = $(`[data-factor-bar="${key}"]`, root);
        if (bar) bar.style.setProperty("--fill", `${(state[key] / 2) * 100}%`);
      });

      const minimum = Math.min(...order.map((key) => state[key]));
      const weakest = order.find((key) => state[key] === minimum);
      const allStrong = minimum === 2;
      if (weakestEl) {
        weakestEl.textContent = allStrong ? "五事俱备 · 仍须看对手" : `当前短板：${factors[weakest].label}`;
      }
      if (adviceEl) {
        adviceEl.textContent = allStrong
          ? "条件很好时最容易高估自己。保留退路，继续观察对手，别把准备充分误当成必胜。"
          : factors[weakest].advice[state[weakest]];
      }
      if (quoteEl) quoteEl.textContent = factors[weakest].quote;
      if (liveEl) {
        liveEl.textContent = `庙算指数 ${total} / 10。${verdict(total)} 当前短板：${factors[weakest].label}。`;
      }
    };

    $$(".factor-choice", root).forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.factor;
        const level = Number(button.dataset.level);
        if (!(key in state)) return;
        state[key] = level;
        $$(`.factor-choice[data-factor="${key}"]`, root).forEach((option) => {
          option.setAttribute("aria-pressed", String(option === button));
        });
        render();
      });
    });

    if (reset) {
      reset.addEventListener("click", () => {
        Object.assign(state, defaults);
        order.forEach((key) => {
          $$(`.factor-choice[data-factor="${key}"]`, root).forEach((option) => {
            option.setAttribute("aria-pressed", String(Number(option.dataset.level) === defaults[key]));
          });
        });
        render();
      });
    }

    render();
  };

  /* ------------------------------------------------------------------
     02 · 潜台词解码器
  ------------------------------------------------------------------ */
  const initSilentDecoder = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const scenes = {
      late: {
        behavior: "会议已经开始 15 分钟，对方仍未到场。",
        a: {
          title: "单时制读法",
          text: "时间是可以预约和切分的资源。迟到意味着占用了别人的时间，也可能被读成对约定与投入的不尊重。",
          next: "先核实是否有未沟通的约束，再一起明确会议真正的“开始时间”。",
          question: "“今天是不是有事情耽误了？我们先对齐今天最重要的 20 分钟，其余部分我整理成文字给你。”"
        },
        b: {
          title: "多时制读法",
          text: "关系与当下情境先于日程。对方可能正在处理一个无法中断的人际承诺，时间不是一个脱离关系存在的资源。",
          next: "不要用“迟到＝不重视”结案。先问路上发生了什么，再协商对今天真正关键的时间点。",
          question: "“路上发生了什么吗？如果今天我们只能解决一件事，你觉得哪一件最不能拖？”"
        }
      },
      silence: {
        behavior: "你提出方案后，会议室安静了几秒。对方没有说“好”，也没有说“不好”。",
        a: {
          title: "低语境读法",
          text: "没有明确同意，通常应视为尚未同意。沉默是一个需要被追问成清晰决定的信息缺口。",
          next: "把模糊的沉默转成可选择的决定，而不是替对方猜测。",
          question: "“我先把选择分成三档：现在拍板、补充信息后再定、暂缓。你更倾向哪一档？”"
        },
        b: {
          title: "高语境读法",
          text: "沉默可能在保护关系，或表示需要时间、需要私下沟通。不当面说“不”，不等于赞成；它只是把拒绝放在了别处。",
          next: "给不同意留一个更安全的通道，再确认决定。",
          question: "“我感觉你可能还有顾虑。要不要会后单独聊五分钟？不当面反对完全没关系。”"
        }
      },
      distance: {
        behavior: "初次见面，对方靠得很近，几乎能碰到你的手臂。",
        a: {
          title: "宽距离边界读法",
          text: "较大的个人空间被视为基本边界。靠得太近可能让人感到被侵入，身体会先于语言做出防御反应。",
          next: "用动作温和地重设距离，而不是用表情表达不适。",
          question: "“我们坐下来聊，这样方便记笔记。”——用身体语言重新设定边界，不必指责对方失礼。"
        },
        b: {
          title: "关系性距离读法",
          text: "更近的距离被用来建立信任与亲近。后退或僵硬可能被读成疏远、拒绝，甚至对对方的不信任。",
          next: "先接住对方的善意，再用自然的移动找到双方都舒适的距离。",
          question: "“谢谢，我也很高兴认识你。我们边坐下边聊？”——不否定亲近，同时把互动带到一个更稳定的空间。"
        }
      }
    };

    let currentScene = "late";
    let currentLens = 0;

    const behaviorEl = $("[data-decoder-behavior]", root);
    const readingA = $('[data-reading="a"]', root);
    const readingB = $('[data-reading="b"]', root);
    const range = $(".decoder-range", root);
    const questionEl = $("[data-decoder-question]", root);
    const liveEl = $("[data-decoder-live]", root);

    const updateReading = (article, data, letter) => {
      if (!article) return;
      const title = $("h3", article);
      const text = $("p:not(.sl-reading__next)", article);
      const next = $(".sl-reading__next", article);
      if (title) title.textContent = data.title;
      if (text) text.textContent = data.text;
      if (next) {
        next.replaceChildren();
        const label = document.createElement("span");
        label.textContent = "下一步";
        next.append(label, document.createTextNode(data.next));
      }
      article.dataset.letter = letter;
    };

    const renderReadings = () => {
      const scene = scenes[currentScene];
      updateReading(readingA, scene.a, "a");
      updateReading(readingB, scene.b, "b");
      const useA = currentLens < 50;
      if (readingA) readingA.classList.toggle("is-current", useA);
      if (readingB) readingB.classList.toggle("is-current", !useA);
      if (questionEl) questionEl.textContent = useA ? scene.a.question : scene.b.question;
      if (liveEl) {
        liveEl.textContent = `镜头：${useA ? "我的默认" : "对方的可能语法"}。${useA ? scene.a.title : scene.b.title}。`;
      }
    };

    $$(".sl-scene", root).forEach((button) => {
      button.addEventListener("click", () => {
        currentScene = button.dataset.scene;
        $$(".sl-scene", root).forEach((option) => {
          option.setAttribute("aria-pressed", String(option === button));
        });
        if (behaviorEl) behaviorEl.textContent = scenes[currentScene].behavior;
        renderReadings();
      });
    });

    const setLens = (value) => {
      currentLens = Math.max(0, Math.min(100, Number(value)));
      if (range) range.value = String(currentLens);
      $$("[data-lens]", root).forEach((button) => {
        const buttonValue = Number(button.dataset.lens);
        button.setAttribute("aria-pressed", String(currentLens < 50 ? buttonValue === 0 : buttonValue === 100));
      });
      renderReadings();
    };

    if (range) range.addEventListener("input", () => setLens(range.value));
    $$("[data-lens]", root).forEach((button) => {
      button.addEventListener("click", () => setLens(button.dataset.lens));
    });

    renderReadings();
  };

  /* ------------------------------------------------------------------
     03 · 文化冰山下潜
  ------------------------------------------------------------------ */
  const initIceberg = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const layers = [
      {
        label: "可见行为",
        place: "水面上",
        title: "沉默，是一个需要被读的信号。",
        body: "你看到的只是沉默。它可能意味着同意、礼貌、思考，也可能意味着“不在这里说”。单凭行为，无法读出意义。",
        question: "先记录：谁沉默？在什么话题上沉默？沉默前后发生了什么？"
      },
      {
        label: "价值观",
        place: "水线下",
        title: "和谐，不是没有意见，而是意见有更安全的说法。",
        body: "如果团队更看重关系连续性与“面子”，公开反对会被视为让彼此失去位置。沉默因此是一种保护，而不是简单的缺席。",
        question: "在这个群体里，什么被视为“有教养”：直接，还是给彼此留余地？"
      },
      {
        label: "基本假设",
        place: "更深层",
        title: "公开冲突会破坏合作，所以真话需要绕路。",
        body: "更深一层，是关于世界如何运作的默认假设：关系比一次决策更重要，冲突的代价会延续到以后。行为只有放回这套假设里，才变得可理解。",
        question: "如果这条假设是真的，我现在最该改变的是推进方式，还是会议设计？"
      }
    ];

    let depth = 0;
    const depthNo = $("[data-ice-depth-no]", root);
    const label = $("[data-ice-label]", root);
    const title = $("[data-ice-title]", root);
    const body = $("[data-ice-body]", root);
    const question = $("[data-ice-question]", root);
    const dive = $("[data-ice-dive]", root);
    const reset = $("[data-ice-reset]", root);
    const live = $("[data-ice-live]", root);

    const render = () => {
      const layer = layers[depth];
      root.dataset.activeDepth = String(depth);
      if (depthNo) depthNo.textContent = `DEPTH 0${depth} / 02`;
      if (label) label.textContent = `${layer.label} · ${layer.place}`;
      if (title) title.textContent = layer.title;
      if (body) body.textContent = layer.body;
      if (question) question.textContent = layer.question;
      if (dive) dive.textContent = depth === layers.length - 1 ? "回到水面" : "再下潜一层";
      $$(".an-depth-btn", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(Number(button.dataset.iceDepth) === depth));
      });
      if (live) live.textContent = `已下潜至第 ${depth} 层：${layer.label}。${layer.title}`;
    };

    $$("[data-ice-depth]", root).forEach((button) => {
      button.addEventListener("click", () => {
        depth = Number(button.dataset.iceDepth);
        render();
      });
    });

    if (dive) {
      dive.addEventListener("click", () => {
        depth = depth === layers.length - 1 ? 0 : depth + 1;
        render();
      });
    }

    if (reset) {
      reset.addEventListener("click", () => {
        depth = 0;
        render();
      });
    }

    render();
  };

  /* ------------------------------------------------------------------
     04 · 涟漪视距
  ------------------------------------------------------------------ */
  const initRipple = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const issues = {
      climate: {
        label: "气候 / CLIMATE",
        levels: [
          {
            scale: "我 · 此刻的选择",
            title: "从今天的一次用电开始",
            affected: "你的通勤、空调与消费构成排放；极端天气也会反过来影响你的健康、电价与食物。",
            right: "呼吸清洁空气、获得可负担的能源。",
            duty: "减少不必要的浪费；了解自己的选择会向谁转移成本。"
          },
          {
            scale: "国家 · 政策与转型",
            title: "国家在替谁做长期决定",
            affected: "能源结构、产业政策与城市韧性决定一国的排放曲线，也受到全球价格、技术与灾害的牵引。",
            right: "发展权与公正转型：不能让承担减排成本的人独自沉底。",
            duty: "设定可信的减排与适应政策；不以邻国和后代为代价换取短期增长。"
          },
          {
            scale: "世界 · 共同的天空",
            title: "边界挡不住大气",
            affected: "升温、粮食价格与气候迁徙跨越国界；排放最少的群体往往承受最重的后果。",
            right: "安全的气候、粮食与尊严；公平的发展空间。",
            duty: "共同但有区别的责任；资金、技术与能力建设；对下一代负责。"
          }
        ]
      },
      health: {
        label: "公共卫生 / PUBLIC HEALTH",
        levels: [
          {
            scale: "我 · 日常的防护",
            title: "你的选择，是公共卫生的一部分",
            affected: "疫苗、就医与防护选择会影响周围人；信息谣言也会沿着社交网络传播。",
            right: "可获得的卫生服务与真实信息。",
            duty: "不故意把可避免的风险转嫁给他人；核实信息再转发。"
          },
          {
            scale: "国家 · 监测与保障",
            title: "国家的监测能力，就是全球的预警系统",
            affected: "监测、医院容量与信息透明度决定疫情能否被看见；全球价格与人员流动又反过来影响国家。",
            right: "公民的健康保障与知情权。",
            duty: "及时共享数据、保护脆弱群体；不把公共卫生当作外交筹码。"
          },
          {
            scale: "世界 · 共同的免疫",
            title: "病原体不需要护照",
            affected: "一次局部暴发可以迅速成为全球危机；疫苗与药物分配不均，会延长所有人的风险。",
            right: "公平获得疫苗、治疗与信息。",
            duty: "早预警、共享科学、反对囤积；把全球健康公共品当作共同安全。"
          }
        ]
      },
      supply: {
        label: "供应链 / SUPPLY CHAIN",
        levels: [
          {
            scale: "我 · 购买与追问",
            title: "低价背后，有谁在承担成本",
            affected: "你的购买选择连接着远方的劳工、资源与环境；价格往往隐藏了被转移的成本。",
            right: "安全的产品与真实的信息。",
            duty: "多问一句“为什么这么便宜”；用选择支持更透明的供应链。"
          },
          {
            scale: "国家 · 规则与竞争",
            title: "监管把全球链条拉回国境",
            affected: "关税、劳工与环境标准影响企业决策；国家的竞争力又与全球市场相互牵制。",
            right: "体面劳动与本地发展空间。",
            duty: "执行尽职调查，不把污染与剥削外包给监管更弱的地方。"
          },
          {
            scale: "世界 · 责任的长链",
            title: "一张订单，就是一条跨国的责任链",
            affected: "矿业、工厂、航运与零售共担风险；地缘冲突和极端天气会让整条链条停摆。",
            right: "公平贸易、救济与公正转型。",
            duty: "企业问责与跨境规则；让受影响者拥有申诉和参与的空间。"
          }
        ]
      }
    };

    let currentIssue = "climate";
    let currentLevel = 0;

    const title = $("[data-ripple-title]", root);
    const issueLabel = $("[data-ripple-issue]", root);
    const affected = $("[data-ripple-affected]", root);
    const right = $("[data-ripple-right]", root);
    const duty = $("[data-ripple-duty]", root);
    const scale = $("[data-ripple-scale]", root);
    const scaleNo = $("[data-ripple-scale-no]", root);
    const next = $("[data-ripple-next]", root);
    const reset = $("[data-ripple-reset]", root);
    const live = $("[data-ripple-live]", root);

    const render = () => {
      const issue = issues[currentIssue];
      const level = issue.levels[currentLevel];
      root.dataset.level = String(currentLevel);
      if (title) title.textContent = level.title;
      if (issueLabel) issueLabel.textContent = issue.label;
      if (affected) affected.textContent = level.affected;
      if (right) right.textContent = level.right;
      if (duty) duty.textContent = level.duty;
      if (scale) scale.textContent = level.scale;
      if (scaleNo) scaleNo.textContent = `视距 0${currentLevel + 1} / 03`;
      if (next) next.textContent = currentLevel === 2 ? "从我开始再看 →" : "把视距拉远 →";
      $$(".gc-level", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(Number(button.dataset.level) === currentLevel));
      });
      $$(".gc-issue", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.issue === currentIssue));
      });
      if (live) live.textContent = `${issue.label}。${level.scale}。${level.title}`;
    };

    $$(".gc-issue", root).forEach((button) => {
      button.addEventListener("click", () => {
        currentIssue = button.dataset.issue;
        currentLevel = 0;
        render();
      });
    });

    $$(".gc-level", root).forEach((button) => {
      button.addEventListener("click", () => {
        currentLevel = Number(button.dataset.level);
        render();
      });
    });

    if (next) {
      next.addEventListener("click", () => {
        currentLevel = currentLevel === 2 ? 0 : currentLevel + 1;
        render();
      });
    }

    if (reset) {
      reset.addEventListener("click", () => {
        currentLevel = 0;
        render();
      });
    }

    render();
  };

  /* ------------------------------------------------------------------
     05 · 异议工作台
  ------------------------------------------------------------------ */
  const initBuyIn = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const attacks = {
      fear: {
        concern: "安全与可预测性。对方不是反对改变，而是害怕不可控的损失。",
        fight: {
          response: "“风险都已经评估过了，不会出问题。”",
          principle: "用结论压过担忧，把问题变成立场之争。",
          outcome: "对方更可能继续加码质疑；你赢了句子，失去了同盟。",
          meter: 20,
          meterLabel: "防御升高"
        },
        invite: {
          response: "“你最担心哪一种失败？我们把它写成试点里的止损条件，并约定谁来喊停。”",
          principle: "承认恐惧合理，再把风险具体化为可共同管理的对象。",
          outcome: "对方从“拦路者”变成风险设计者；反对开始提供信息。",
          meter: 82,
          meterLabel: "共同承担"
        }
      },
      delay: {
        concern: "既有利益与节奏。拖延有时是在保护已经投入的资源、位置和熟悉的工作方式。",
        fight: {
          response: "“机会窗口很短，再拖就真的来不及了。”",
          principle: "把时间焦虑抛回给对方，但没有回答他真正害怕失去什么。",
          outcome: "对方更可能用新的理由继续推迟；你显得急，他显得稳。",
          meter: 25,
          meterLabel: "僵持"
        },
        invite: {
          response: "“如果必须等，你希望看到哪个前提先成熟？我们为它设一个可见的里程碑。”",
          principle: "把拖延翻译成条件，把等待变成可管理的阶段，而不是无期限的悬置。",
          outcome: "对方必须说出真实条件；你也获得了一个可以推进的路径。",
          meter: 76,
          meterLabel: "找到条件"
        }
      },
      confusion: {
        concern: "信息过载或失控感。对方可能真的没听懂，也可能不想承认自己被排除在设计之外。",
        fight: {
          response: "“我已经讲过三遍了，关键就在这里。”",
          principle: "把理解问题变成对方的能力问题，关系开始受伤。",
          outcome: "对方更可能沉默或点头敷衍，却不会真正投入。",
          meter: 28,
          meterLabel: "对话关闭"
        },
        invite: {
          response: "“请你告诉我，哪一步最不清楚？我从你每天的工作场景再讲一遍。”",
          principle: "先用对方的语言重建场景，再给信息；降低复杂度，而不是增加音量。",
          outcome: "对方获得了参与的入口，模糊开始变成具体问题。",
          meter: 72,
          meterLabel: "重新对齐"
        }
      },
      character: {
        concern: "身份、地位或既得利益受到威胁。攻击人，往往是为了把讨论拉回自己更熟悉的权力位置。",
        fight: {
          response: "“这是人身攻击，我们不谈这个。”",
          principle: "划线是对的，但如果只有防御，议题仍被对方占据。",
          outcome: "支持者看见你被激怒；中间人悄悄后退。",
          meter: 18,
          meterLabel: "冲突升级"
        },
        invite: {
          response: "“我可能确实漏掉了前线细节。请你指出最容易被误解的一点，我会修正方案，也保留你的署名。”",
          principle: "不接招，不自证；把攻击翻译成一个可回应的具体问题，同时邀请对方进入修正过程。",
          outcome: "对方获得尊重与位置，你保住了方案；旁观者看到你处理冲突的方式。",
          meter: 80,
          meterLabel: "共同修正"
        }
      }
    };

    let currentAttack = "fear";
    let currentPosture = "invite";

    const concern = $("[data-buyin-concern]", root);
    const response = $("[data-buyin-response]", root);
    const principle = $("[data-buyin-principle]", root);
    const outcome = $("[data-buyin-outcome]", root);
    const meter = $("[data-buyin-meter]", root);
    const meterLabel = $("[data-buyin-meter-label]", root);
    const live = $("[data-buyin-live]", root);

    const render = () => {
      const selected = attacks[currentAttack][currentPosture];
      const attack = attacks[currentAttack];
      if (concern) concern.textContent = attack.concern;
      if (response) response.textContent = selected.response;
      if (principle) principle.textContent = selected.principle;
      if (outcome) outcome.textContent = selected.outcome;
      if (meter) meter.style.setProperty("--meter", `${selected.meter}%`);
      if (meterLabel) meterLabel.textContent = selected.meterLabel;
      $$(".bi-attack-btn", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.attack === currentAttack));
      });
      $$("[data-posture]", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.posture === currentPosture));
      });
      if (live) live.textContent = `当前姿态：${currentPosture === "invite" ? "邀请参与" : "本能反击"}。${selected.outcome}`;
    };

    $$(".bi-attack-btn", root).forEach((button) => {
      button.addEventListener("click", () => {
        currentAttack = button.dataset.attack;
        render();
      });
    });

    $$("[data-posture]", root).forEach((button) => {
      button.addEventListener("click", () => {
        currentPosture = button.dataset.posture;
        render();
      });
    });

    render();
  };

  /* ------------------------------------------------------------------
     06 · 领导力诊断盘
  ------------------------------------------------------------------ */
  const initLeadershipDiagnostic = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const situations = {
      busy: {
        summary: "忙碌不是产能，是排序失灵。",
        copy: "团队把注意力分散在太多“看起来都重要”的事情上；同时，你仍在替他们承担判断。结果是每个人都很忙，组织却没有前进。",
        actions: [
          { law: "优先次序", text: "列出本周所有事项，只保留对唯一目标有直接贡献的三件；公开一张“不做清单”。" },
          { law: "授权", text: "把“怎么做”交给最接近现场的人，同时把边界和检查点说清楚。" },
          { law: "盖子", text: "先问自己：我是否在用个人勤奋，掩盖团队系统没有建起来？" }
        ]
      },
      pivot: {
        summary: "变革期最缺的，不是更多信息，而是可复述的方向和第一场小胜。",
        copy: "战略已经变了，但团队仍用旧标准判断优先级。此时增加会议和口号不会产生确定性；一个清楚的取舍和一个看得见的进展才会。",
        actions: [
          { law: "导航", text: "用一句话回答“为什么变、去哪里、先放弃什么”，并让每个人能复述。" },
          { law: "势头", text: "在 90 天内做出一场可见的小胜，把资源和故事集中到它上面。" },
          { law: "盖子", text: "变革的上限，是领导者自己对不确定性的容纳度。" }
        ]
      },
      notgrow: {
        summary: "你越能干，团队越不需要长大。",
        copy: "你给答案的速度，正在变成团队停止思考的速度。表面上你解决了问题，实际上把判断力、关系与风险都留在了自己身上。",
        actions: [
          { law: "盖子", text: "把“我来做更快”识别为组织风险，而不是个人美德。" },
          { law: "授权", text: "把判断标准、信息与可犯错的边界交给对方，而不是只交任务。" },
          { law: "传承", text: "把关键判断与关系显性化，让团队在你缺席时仍能运转。" }
        ]
      },
      stall: {
        summary: "失速时最危险的，是用加速掩盖方向错误。",
        copy: "增长突然停滞，团队自然会想“再多做一点”。但如果外部环境已经变向，更多执行只会更快地消耗组织。先判断方向，再决定力度。",
        actions: [
          { law: "导航", text: "先判断是市场变向还是执行失速；不要用更多会议替代判断。" },
          { law: "优先次序", text: "资源集中到唯一最可能的突破口，停止平均用力。" },
          { law: "势头", text: "保护能带来信心的小胜，砍掉只消耗势能的假动作。" }
        ]
      }
    };

    let current = "busy";
    const summary = $("[data-diag-summary]", root);
    const copy = $("[data-diag-copy]", root);
    const actions = $("[data-diag-actions]", root);
    const live = $("[data-diag-live]", root);

    const render = () => {
      const situation = situations[current];
      if (summary) summary.textContent = situation.summary;
      if (copy) copy.textContent = situation.copy;
      if (actions) {
        actions.replaceChildren();
        situation.actions.forEach((item) => {
          const article = document.createElement("article");
          const label = document.createElement("span");
          const text = document.createElement("p");
          label.textContent = item.law;
          text.textContent = item.text;
          article.append(label, text);
          actions.append(article);
        });
      }
      const activeLaws = new Set(situation.actions.map((item) => item.law));
      const nodeMap = {
        "盖子": "lid",
        "导航": "navigation",
        "优先次序": "priorities",
        "授权": "empowerment",
        "势头": "momentum",
        "传承": "legacy"
      };
      const activeIds = new Set([...activeLaws].map((name) => nodeMap[name]));
      $$("[data-law-node]", root).forEach((node) => {
        node.classList.toggle("is-lit", activeIds.has(node.dataset.lawNode));
      });
      $$(".l21-scenario", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.situation === current));
      });
      if (live) live.textContent = `${situation.summary} 相关法则：${situation.actions.map((a) => a.law).join("、")}。`;
    };

    $$(".l21-scenario", root).forEach((button) => {
      button.addEventListener("click", () => {
        current = button.dataset.situation;
        render();
      });
    });

    render();
  };

  /* ------------------------------------------------------------------
     07 · 猴子归属模拟器
  ------------------------------------------------------------------ */
  const initMonkey = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const scenes = [
      {
        quote: "“客户临时改需求了。现在怎么办？”",
        speaker: "下属 · 小林",
        options: [
          {
            label: "“交给我，你先忙别的。”",
            owner: "leader",
            ownerLabel: "已跳回：你的背上",
            initiative: 1,
            feedback: "猴子跳回你背上。你解决了这一次，却让下一次更容易来找你。",
            detail: "下一步：你负责；小林只负责等待。"
          },
          {
            label: "“先给我三个可选方案和各自代价，明早一起做决定。”",
            owner: "employee",
            ownerLabel: "留在：小林背上",
            initiative: 4,
            feedback: "猴子留在小林背上。他带着判断来，而不是把问题递给你；检查点让风险可控。",
            detail: "下一步：小林负责；明天上午共同评估。"
          },
          {
            label: "“照我说的做，先拖住客户。”",
            owner: "employee",
            ownerLabel: "名义上在小林背上",
            initiative: 1,
            feedback: "指挥很清楚，但猴子没有真正长大：小林学会了等待命令，判断仍然由你独占。",
            detail: "下一步：小林执行；你仍是唯一的决策者。"
          }
        ]
      },
      {
        quote: "“方案我写好了，你帮我改一下，明早就要。”",
        speaker: "下属 · 小林",
        options: [
          {
            label: "“把文档给我，我今晚改。”",
            owner: "leader",
            ownerLabel: "已跳回：你的背上",
            initiative: 1,
            feedback: "你又接回一只猴子。短期交付可能更快，长期却让小林习惯把最终质量交给你兜底。",
            detail: "下一步：你负责修改；小林不知道自己的判断错在哪里。"
          },
          {
            label: "“你标出最不确定的两处，我标一处；早上八点一起看，最终版本你发。”",
            owner: "employee",
            ownerLabel: "留在：小林背上",
            initiative: 4,
            feedback: "这是一次共同编辑，而不是替他完成。小林保留了责任，也获得了一个可以学习的边界。",
            detail: "下一步：小林负责最终版本；你们各自带着判断来检查。"
          },
          {
            label: "“全部重写，按我的思路来。”",
            owner: "employee",
            ownerLabel: "名义上在小林背上",
            initiative: 2,
            feedback: "猴子名义上下去了，绳子还在你手里。小林得到的是指令，不是能力。",
            detail: "下一步：小林执行重写；他不知道为什么这样更好。"
          }
        ]
      },
      {
        quote: "“这次项目复盘，我能不参加吗？我怕被批评。”",
        speaker: "下属 · 小林",
        options: [
          {
            label: "“行，我替你说明。”",
            owner: "leader",
            ownerLabel: "已跳回：你的背上",
            initiative: 1,
            feedback: "你替小林承担了面对结果的责任。保护了这一次，却把复盘变成了你的独白。",
            detail: "下一步：你负责解释；小林没有机会修正自己的判断。"
          },
          {
            label: "“复盘只谈系统，不追责个人。你来，先写三条可改进的动作。”",
            owner: "employee",
            ownerLabel: "留在：小林背上",
            initiative: 4,
            feedback: "你把心理安全与责任放在同一张桌上。小林可以带着行动来，而不是带着恐惧逃开。",
            detail: "下一步：小林带来三条改进动作；你负责守住“对事不对人”的边界。"
          },
          {
            label: "“必须来，别想逃。”",
            owner: "employee",
            ownerLabel: "人在，判断不在",
            initiative: 1,
            feedback: "小林会到场，但可能只学会如何避免被批评，而不是如何把项目做得更好。",
            detail: "下一步：小林被动参与；真正的复盘仍没有发生。"
          }
        ]
      }
    ];

    let sceneIndex = 0;
    let results = [];
    let waitingForNext = false;

    const choiceList = $("[data-choice-list]", root);
    const sceneNo = $("[data-scene-no]", root);
    const speaker = $("[data-speaker]", root);
    const dialogue = $("[data-dialogue]", root);
    const ownerLabel = $("[data-owner-label]", root);
    const feedback = $("[data-feedback]", root);
    const feedbackText = $("[data-feedback-text]", root);
    const feedbackDetail = $("[data-feedback-detail]", root);
    const initiative = $("[data-initiative]", root);
    const next = $("[data-next-scene]", root);
    const dots = $$(".mk-dotline span", root);
    const live = $("[data-monkey-live]", root);

    const updateDots = () => {
      dots.forEach((dot, index) => dot.classList.toggle("is-current", index === sceneIndex));
    };

    const reset = () => {
      sceneIndex = 0;
      results = [];
      waitingForNext = false;
      root.dataset.owner = "neutral";
      if (ownerLabel) ownerLabel.textContent = "还没决定";
      renderScene();
    };

    const renderFinalFeedback = () => {
      const average = results.reduce((sum, value) => sum + value, 0) / Math.max(results.length, 1);
      let summary = "";
      if (average >= 3.5) {
        summary = "三次都让下一步留在下属背上。管理不是不帮，而是让对方带着责任来，你提供边界与支持。";
      } else if (average >= 2.3) {
        summary = "你开始把问题留在正确的背上，但仍会在关键时刻替下属承担判断。下一步，试着少给一个答案，多问一个判断标准。";
      } else {
        summary = "你把猴子一次次抱回自己背上。团队会越来越依赖你，也会越来越被动；先从“带着建议来”这一条规则开始。";
      }
      if (feedbackText) {
        feedbackText.textContent = summary;
      }
      if (feedbackDetail) {
        feedbackDetail.textContent = `本次选择的平均主动性：${average.toFixed(1)} / 5。刷新或重来可以重新练习。`;
      }
      if (initiative) initiative.textContent = "本轮结果";
      if (next) {
        next.textContent = "重新走一遍 ↺";
        next.hidden = false;
      }
      waitingForNext = false;
    };

    const choose = (option, selectedButton) => {
      results.push(option.initiative);
      root.dataset.owner = option.owner;
      if (ownerLabel) ownerLabel.textContent = option.ownerLabel;
      if (initiative) initiative.textContent = `主动性 ${option.initiative} / 5`;
      if (feedbackText) feedbackText.textContent = option.feedback;
      if (feedbackDetail) feedbackDetail.textContent = option.detail;
      if (feedback) feedback.hidden = false;
      if (live) live.textContent = `${option.ownerLabel}。主动性 ${option.initiative} / 5。${option.feedback}`;
      $$(".mk-option", root).forEach((button) => {
        button.disabled = true;
        button.classList.toggle("is-selected", button === selectedButton);
      });
      if (next) {
        next.hidden = false;
        next.textContent = sceneIndex === scenes.length - 1 ? "查看三次的结果 →" : "进入下一幕 →";
      }
      waitingForNext = true;
    };

    const renderScene = () => {
      const scene = scenes[sceneIndex];
      if (sceneNo) sceneNo.textContent = `0${sceneIndex + 1}`;
      if (speaker) speaker.textContent = scene.speaker;
      if (dialogue) dialogue.textContent = scene.quote;
      if (choiceList) {
        choiceList.replaceChildren();
        scene.options.forEach((option, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "mk-option";
          const no = document.createElement("span");
          no.textContent = `0${index + 1}`;
          button.append(no, document.createTextNode(option.label));
          button.addEventListener("click", () => choose(option, button));
          choiceList.append(button);
        });
      }
      if (feedback) feedback.hidden = true;
      if (next) next.hidden = true;
      updateDots();
      if (live) live.textContent = `第 ${sceneIndex + 1} 场，共三场。${scene.quote}`;
    };

    if (next) {
      next.addEventListener("click", () => {
        if (!waitingForNext) {
          reset();
          return;
        }
        if (sceneIndex === scenes.length - 1) {
          renderFinalFeedback();
          if (live) live.textContent = "三次选择已完成。上方为本次结果，点击重新走一遍可再次练习。";
          waitingForNext = false;
          return;
        }
        sceneIndex += 1;
        renderScene();
      });
    }

    renderScene();
  };

  /* ------------------------------------------------------------------
     08 · 90 秒汇报搭建器
  ------------------------------------------------------------------ */
  const initPyramidBuilder = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const leadData = {
      direct: {
        ok: true,
        text: "把 Q3 增长重心转向企业直销，同时暂停向高库存经销商压货。",
        short: "转向企业直销，暂停向高库存经销商压货"
      },
      report: {
        ok: false,
        reason: "“汇报整体情况”不是一个可被带走的结论；它只是把决定再次推迟。"
      },
      abstract: {
        ok: false,
        reason: "“加强协同、提升能力”听起来正确，却没有回答 Q3 缺 12% 这个具体问题，也无法指导下一步。"
      }
    };

    const supportData = {
      demand: { ok: true, short: "直销转化率 9.8% > 经销 6.1%" },
      inventory: { ok: true, short: "库存升至 78 天，压货放大退货风险" },
      feasibility: { ok: true, short: "两周可筛出 20 家目标企业" },
      competitor: {
        ok: false,
        reason: "“对手也在直播”是背景信息，不能回答为什么此刻应该转向企业直销。它可能相关，却不是一个支撑理由。"
      },
      training: {
        ok: false,
        reason: "“加强培训”是泛泛的行动手段，不是结论成立的证据；它也无法说明为什么是这个季度、这个方向。"
      }
    };

    let lead = null;
    let supports = [];

    const top = $("[data-pb-top]", root);
    const list = $("[data-pb-supports]", root);
    const count = $("[data-pb-count]", root);
    const feedback = $("[data-pb-feedback]", root);
    const reset = $("[data-pb-reset]", root);
    const live = $("[data-pb-feedback]", root);

    const render = () => {
      if (top) top.textContent = lead ? leadData[lead].text : "等待你的一句话结论";
      if (count) count.textContent = `${supports.length} / 3`;
      if (list) {
        list.replaceChildren();
        if (!supports.length) {
          const empty = document.createElement("span");
          empty.className = "py-pyramid__empty";
          empty.textContent = "三条理由会在这里承重";
          list.append(empty);
        } else {
          supports.forEach((key) => {
            const item = document.createElement("span");
            item.textContent = supportData[key].short;
            list.append(item);
          });
        }
      }
      $$(".py-lead", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.lead === lead));
      });
      $$(".py-support", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(supports.includes(button.dataset.support)));
      });

      if (!feedback) return;
      feedback.classList.remove("is-success");
      if (!lead) {
        feedback.textContent = "先从第一组里选一句能被带走的结论。";
      } else if (!leadData[lead].ok) {
        feedback.textContent = leadData[lead].reason;
      } else if (supports.length < 3) {
        feedback.textContent = `结论已经站住。还需要 ${3 - supports.length} 条彼此独立的理由来承重。`;
      } else {
        const badSupports = supports.filter((key) => !supportData[key].ok);
        if (badSupports.length) {
          feedback.textContent = badSupports.map((key) => supportData[key].reason).join(" ");
        } else {
          feedback.classList.add("is-success");
          feedback.textContent = "结构成立：结论直接回答「怎么办」；三条理由分别覆盖机会、风险与可行性，互不重叠，也都指向同一个决定。";
        }
      }
      if (live) live.textContent = feedback.textContent;
    };

    $$(".py-lead", root).forEach((button) => {
      button.addEventListener("click", () => {
        lead = button.dataset.lead;
        render();
      });
    });

    $$(".py-support", root).forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.support;
        if (supports.includes(key)) {
          supports = supports.filter((item) => item !== key);
        } else if (supports.length >= 3) {
          if (feedback) {
            feedback.classList.remove("is-success");
            feedback.textContent = "同层只保留三条理由。先拿掉一条，再换入新的——金字塔需要的是取舍，不是堆积。";
          }
          return;
        } else {
          supports = [...supports, key];
        }
        render();
      });
    });

    if (reset) {
      reset.addEventListener("click", () => {
        lead = null;
        supports = [];
        render();
      });
    }

    render();
  };

  /* ------------------------------------------------------------------
     09 · 橡果配方
  ------------------------------------------------------------------ */
  const initAcorn = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const audiences = {
      finance: {
        label: "财务总监",
        toast: "投入产出比、风险可控、可被验证的结果。"
      },
      newcomer: {
        label: "新员工",
        toast: "成长路径、被看见、有人带，能尽快独立。"
      },
      client: {
        label: "外部客户",
        toast: "稳定交付、少操心、长期价值与可靠回应。"
      }
    };

    let audience = "finance";
    let opening = null;
    let proof = null;
    let hook = null;

    const toast = $("[data-acorn-toast]", root);
    const scoreEl = $("[data-acorn-score]", root);
    const meter = $("[data-acorn-meter]", root);
    const preview = $("[data-acorn-preview]", root);
    const feedback = $("[data-acorn-feedback]", root);
    const live = $("[data-acorn-live]", root);

    const selectedText = (selector) => {
      const button = $(`${selector}[aria-pressed="true"]`, root);
      return button ? button.textContent.trim() : "";
    };

    const render = () => {
      const openingText = selectedText(".sq-opening");
      const proofText = selectedText(".sq-proof");
      const hookText = selectedText(".sq-hook");
      const openingMatch = opening === audience;
      const proofGood = proof && proof !== "weak";
      const hookGood = hook && hook !== "abstract";
      const score = (openingMatch ? 1 : 0) + (proofGood ? 1 : 0) + (hookGood ? 1 : 0);

      if (toast) toast.textContent = audiences[audience].toast;
      if (scoreEl) scoreEl.textContent = `${score} / 3`;
      if (meter) meter.style.setProperty("--score", `${(score / 3) * 100}%`);

      if (preview) {
        if (!openingText) {
          preview.textContent = "先为你的听众选一个开场。";
        } else {
          let output = `对${audiences[audience].label}说：${openingText}`;
          if (proofText) output += ` 支撑它的是：${proofText}`;
          if (hookText) output += ` 你可以把它想象成：${hookText}`;
          preview.textContent = output;
        }
      }

      if (feedback) {
        if (!openingText) {
          feedback.textContent = "相关性是入口。先选一句能让听众觉得“这和我有关”的开场。";
        } else if (!openingMatch) {
          feedback.textContent = `这句话与${audiences[audience].label}的橡果错位了：它在说你的方案，而不是对方真正得到的东西。换一个与他需要直接相连的入口。`;
        } else if (!proofText) {
          feedback.textContent = "开场已经对准了。接下来需要证据——不是“我们觉得好”，而是可被验证的结果或机制。";
        } else if (proof === "weak") {
          feedback.textContent = "“大家都觉得好”不是证据。它证明的是内部共识，不是对听众的承诺。换一个可复查的数据或具体做法。";
        } else if (!hookText) {
          feedback.textContent = "可信度有了，但还需要一个能被带走的画面。大脑记住形象，比记住术语容易得多。";
        } else if (hook === "abstract") {
          feedback.textContent = "“系统性升级”听起来正确，却很难在大脑里留下画面。试着把它换算成时间、金钱或一个具体场景。";
        } else {
          feedback.textContent = "相关性、可信度与画面都到位了。最后再检查顺序与情感：这个开头，是否让听众在理性之前先愿意靠近？";
        }
      }

      if (live) {
        live.textContent = `当前听众：${audiences[audience].label}。橡果完整度 ${score} / 3。${feedback ? feedback.textContent : ""}`;
      }
    };

    $$(".sq-audience", root).forEach((button) => {
      button.addEventListener("click", () => {
        audience = button.dataset.audience;
        $$(".sq-audience", root).forEach((option) => {
          option.setAttribute("aria-pressed", String(option === button));
        });
        render();
      });
    });

    const bindChoice = (selector, key) => {
      $$(selector, root).forEach((button) => {
        button.addEventListener("click", () => {
          const value = button.dataset[key];
          const current = key === "opening" ? opening : key === "proof" ? proof : hook;
          const nextValue = current === value ? null : value;
          if (key === "opening") opening = nextValue;
          if (key === "proof") proof = nextValue;
          if (key === "hook") hook = nextValue;
          $$(selector, root).forEach((option) => {
            option.setAttribute("aria-pressed", String(option.dataset[key] === nextValue));
          });
          render();
        });
      });
    };

    bindChoice(".sq-opening", "opening");
    bindChoice(".sq-proof", "proof");
    bindChoice(".sq-hook", "hook");

    render();
  };

  /* ------------------------------------------------------------------
     10 · 信任坐标
  ------------------------------------------------------------------ */
  const initTrustCoords = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const profiles = {
      navigator: {
        label: "当前象限 / 可信的领航者",
        title: "你让人既看见立场，也感到被理解。",
        body: "真实与适应可以并存：你知道自己相信什么，也愿意根据现场调整表达方式。追随者不需要你完美，只需要知道你从哪里来、会把大家带到哪里。",
        action: "在关键场合适度暴露一次不确定性，同时给出你仍愿意承担的责任。"
      },
      solo: {
        label: "当前象限 / 真诚的独行者",
        title: "你说的是真话，但不一定被听懂。",
        body: "你的立场清楚、存在感强，却可能忽略了现场的情绪与权力关系。真实如果缺少情境感知，容易变成“我只管做自己”，让别人承担沟通成本。",
        action: "在表达立场前，先复述一遍对方真正担心的事；真实不是只顾自己痛快。"
      },
      chameleon: {
        label: "当前象限 / 熟练的变色龙",
        title: "你很会适应，却让人不知道你站在哪里。",
        body: "你能读懂空气、调整姿态，却可能把真实立场藏得太深。没有稳定内核的适应，会让追随者无法预测你在关键时刻会做什么。",
        action: "挑一个低风险场景，说出与主流不同的判断，并说明你的依据。"
      },
      drifter: {
        label: "当前象限 / 被动的漂流者",
        title: "既没有清楚的立场，也没有读懂现场。",
        body: "团队只能靠职位猜测你的意图。此时最重要的不是增加魅力，而是先建立可被感知的稳定性：你重视什么，在什么条件下会说不。",
        action: "先写下一句你愿意为之承担代价的原则，并在下一次会议中用它做一次判断。"
      }
    };

    const authRange = $("[data-trust-authenticity]", root);
    const senseRange = $("[data-trust-sensing]", root);
    const authValue = $("[data-trust-auth]", root);
    const senseValue = $("[data-trust-sense]", root);
    const dot = $("[data-trust-dot]", root);
    const label = $("[data-trust-quadrant]", root);
    const title = $("[data-trust-title]", root);
    const body = $("[data-trust-body]", root);
    const action = $("[data-trust-action]", root);
    const live = $("[data-trust-live]", root);

    const render = () => {
      const auth = Number(authRange ? authRange.value : 60);
      const sense = Number(senseRange ? senseRange.value : 60);
      if (authValue) authValue.textContent = String(auth);
      if (senseValue) senseValue.textContent = String(sense);
      if (dot) {
        dot.style.left = `${auth}%`;
        dot.style.top = `${100 - sense}%`;
      }
      const highAuth = auth >= 50;
      const highSense = sense >= 50;
      const profile = highAuth && highSense ? profiles.navigator : highAuth ? profiles.solo : highSense ? profiles.chameleon : profiles.drifter;
      if (label) label.textContent = profile.label;
      if (title) title.textContent = profile.title;
      if (body) body.textContent = profile.body;
      if (action) {
        action.replaceChildren();
        const note = document.createElement("span");
        note.textContent = "下一次练习 / TRY";
        action.append(note, document.createTextNode(profile.action));
      }
      if (live) live.textContent = `真实性 ${auth}，情境感知 ${sense}。${profile.title}`;
    };

    [authRange, senseRange].forEach((range) => {
      if (range) range.addEventListener("input", render);
    });

    render();
  };

  /* ------------------------------------------------------------------
     11 · 直觉拦截器
  ------------------------------------------------------------------ */
  const initCRT = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const questions = [
      {
        question: "一副球拍和一个球一共 1.10 美元。球拍比球贵 1.00 美元。球多少钱？",
        answers: ["0.10 美元", "0.05 美元", "0.15 美元"],
        correct: 1,
        intuitive: 0,
        system: "很多人脱口而出 0.10 美元。系统一把“总共 1.10、贵 1 美元”快速处理成一个熟悉的小数故事，却没有真正做减法。",
        explanation: "设球为 x，球拍为 x + 1；2x + 1 = 1.10，所以 x = 0.05 美元。系统二并不神秘，它只是愿意把等式写出来。"
      },
      {
        question: "睡莲每天覆盖湖面的面积翻一倍。第 48 天铺满整个湖，那么第几天铺满一半？",
        answers: ["24 天", "47 天", "46 天"],
        correct: 1,
        intuitive: 0,
        system: "“48 天的一半”很容易被读成“24 天”。系统一对“一半”这个词反应非常快，却忽略了“每天翻倍”这个增长规则。",
        explanation: "如果第 48 天铺满，那么前一天正好是一半，即第 47 天。倒着读规则，比顺着常识猜更可靠。"
      },
      {
        question: "5 台机器 5 分钟生产 5 个零件。100 台机器生产 100 个零件需要多久？",
        answers: ["5 分钟", "20 分钟", "100 分钟"],
        correct: 0,
        intuitive: 2,
        system: "数量一起放大，看起来时间也该一起放大。系统一喜欢线性直觉，于是把“100 个”直接连到“100 分钟”。",
        explanation: "1 台机器生产 1 个零件需要 5 分钟。100 台机器同时生产，每台做一个，仍然只需要 5 分钟。"
      }
    ];

    let index = 0;
    let answered = false;
    let correctCount = 0;
    let finished = false;

    const count = $("[data-crt-count]", root);
    const question = $("[data-crt-question]", root);
    const options = $("[data-crt-options]", root);
    const reveal = $("[data-crt-feedback]", root);
    const system = $("[data-crt-system]", root);
    const explanation = $("[data-crt-explanation]", root);
    const next = $("[data-crt-next]", root);
    const score = $("[data-crt-score]", root);
    const live = $("[data-crt-live]", root);

    const render = () => {
      if (finished) return;
      answered = false;
      const item = questions[index];
      if (count) count.textContent = `QUESTION 0${index + 1} / 03`;
      if (question) question.textContent = item.question;
      if (options) {
        options.hidden = false;
        options.replaceChildren();
        item.answers.forEach((answer, answerIndex) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "tk-answer";
          button.textContent = answer;
          button.addEventListener("click", () => answerQuestion(answerIndex));
          options.append(button);
        });
      }
      if (reveal) {
        reveal.hidden = true;
        $$(".tk-answer-block span", reveal).forEach((label, labelIndex) => {
          label.textContent = labelIndex === 0 ? "系统一先说 / FAST ANSWER" : "慢一步看 / SLOW CHECK";
        });
      }
      if (next) {
        next.hidden = true;
        next.textContent = index === questions.length - 1 ? "查看结果 →" : "下一题 →";
      }
      if (score) score.textContent = "答对不是目的。看见抢答的那一秒，才是。";
      if (live) live.textContent = `第 ${index + 1} 题，共三题。${item.question}`;
    };

    const answerQuestion = (answerIndex) => {
      if (answered) return;
      answered = true;
      const item = questions[index];
      const answerButtons = $$(".tk-answer", root);
      answerButtons.forEach((button, buttonIndex) => {
        button.disabled = true;
        if (buttonIndex === item.correct) button.classList.add("is-correct");
        if (buttonIndex === answerIndex && answerIndex !== item.correct) button.classList.add("is-wrong");
      });
      if (answerIndex === item.correct) correctCount += 1;
      if (system) system.textContent = item.system;
      if (explanation) explanation.textContent = item.explanation;
      if (reveal) reveal.hidden = false;
      if (score) score.textContent = `本轮已答对 ${correctCount} / ${index + 1}。注意：答错并不说明你不聪明，只说明系统一先到了。`;
      if (next) next.hidden = false;
      if (live) {
        live.textContent = `你选择了 ${item.answers[answerIndex]}。正确答案是 ${item.answers[item.correct]}。${item.system}`;
      }
    };

    const showSummary = () => {
      finished = true;
      if (count) count.textContent = "RESULTS / 03";
      if (question) question.textContent = "你看见了系统一多少次“立刻知道”？";
      if (options) {
        options.hidden = true;
        options.replaceChildren();
      }
      if (reveal) {
        reveal.hidden = false;
        $$(".tk-answer-block span", reveal).forEach((label, i) => {
          label.textContent = i === 0 ? "一个提醒 / REMINDER" : "一个动作 / PRACTICE";
        });
      }
      if (system) {
        system.textContent = "这三道题只是演示：系统一给出的答案，往往不是随机错误，而是可预测的错误。知道它，并不会自动免疫。";
      }
      if (explanation) {
        explanation.textContent = "在重大判断前，把基准率、外部视角、事前验尸和独立判断写进流程。让系统二用结构上班，而不是靠意志力。";
      }
      if (score) {
        score.textContent = `本轮 ${correctCount} / 3。比分数更重要的是：你下一次能否在关键处暂停半秒。`;
      }
      if (next) {
        next.hidden = false;
        next.textContent = "再做一遍 ↺";
      }
      if (live) live.textContent = `本轮共答对 ${correctCount} 题，共三题。${system ? system.textContent : ""}`;
    };

    if (next) {
      next.addEventListener("click", () => {
        if (finished) {
          index = 0;
          correctCount = 0;
          finished = false;
          render();
          return;
        }
        if (index === questions.length - 1) {
          showSummary();
          return;
        }
        index += 1;
        render();
      });
    }

    render();
  };

  /* ------------------------------------------------------------------
     12 · 全球协作网络
  ------------------------------------------------------------------ */
  const initFlatMap = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const products = {
      phone: {
        ideal: "理想模型：设计、芯片、部件、组装与市场被连接成一条高效协作链。",
        friction: "现实摩擦：芯片出口管制、关税与航运中断，会让这条链在几个节点同时变慢。",
        nodes: [
          { label: "设计", place: "美国 / 德国", role: "产品定义与系统设计", body: "决定产品的功能、体验与成本结构。一个设计选择，会在几千公里外的制造与组装环节变成工艺要求。", friction: "设计工具、专利与出口管制让“设计无国界”变成有条件的开放。" },
          { label: "芯片", place: "中国台湾 / 韩国", role: "先进制程与存储", body: "把设计变成可运行的算力核心。先进制程高度集中，少数供应商决定大多数设备的性能上限。", friction: "先进制程集中在少数节点，一次地缘冲击就会传导到全球电子供应链。" },
          { label: "精密部件", place: "日本 / 德国", role: "光学、传感器与设备", body: "把材料、光学与精密制造能力注入整机。它们很少出现在广告里，却决定良率与体验。", friction: "关键设备与材料受到许可和供应协议约束，替代通常需要多年。" },
          { label: "组装", place: "中国 / 越南 / 印度", role: "规模制造与品质控制", body: "把全球采购的部件组织成可交付的产品。这里竞争的不是单点技术，而是工程、速度与供应链协同。", friction: "关税、劳工标准与产业政策不断改变“最便宜在哪里组装”的答案。" },
          { label: "市场", place: "全球", role: "平台、运营商与消费者", body: "最终价值在全球市场兑现。渠道、结算、合规与品牌信任，决定了产品能否真正抵达用户。", friction: "数据规则、平台分成与本地化合规，让同一款产品在不同市场面对不同的门。" }
        ]
      },
      coffee: {
        ideal: "理想模型：种植者、贸易商、烘焙师与门店共同构成一条跨洲风味链。",
        friction: "现实摩擦：气候灾害、期货价格与运输成本，首先挤压最上游的小农。",
        nodes: [
          { label: "种植", place: "埃塞俄比亚 / 哥伦比亚", role: "气候、品种与产地风味", body: "风味从土地开始。降雨、海拔与劳动力决定收成，也决定种植者能否承担下一季的风险。", friction: "极端天气与病害会直接压低产量，而小农往往没有足够的保险与议价能力。" },
          { label: "处理", place: "产地处理站", role: "发酵、干燥与品质分级", body: "处理方式塑造风味，也决定生豆能否进入高端市场。技术与资金的不平等从这里开始。", friction: "水资源、加工设备与认证成本，会把小农挡在高价市场之外。" },
          { label: "贸易", place: "新加坡 / 迪拜", role: "定价、金融与物流", body: "咖啡在到达杯中之前，先在期货与航运系统里流动。价格并不只由风味决定，也由金融与库存决定。", friction: "期货波动、汇率与航运成本，让一整年的收入可能被几周的市场变化改写。" },
          { label: "烘焙", place: "中国 / 欧洲", role: "加工、品牌与零售", body: "烘焙商把生豆变成可消费的风味产品，也捕获了品牌与渠道溢价。", friction: "品牌与渠道集中，让上游很难分享终端溢价；碳与包装要求又增加合规成本。" },
          { label: "门店", place: "全球城市", role: "体验、社区与消费", body: "消费者在门店里买单，也在那里理解产地故事。信息透明度决定了这条链是否公平。", friction: "“可持续”标签未必可验证；消费者需要更具体的信息，才可能为公平付费。" }
        ]
      },
      film: {
        ideal: "理想模型：故事、制作、算力、发行与观众被平台连接成一次全球协作。",
        friction: "现实摩擦：内容配额、数据规则与平台权力，决定作品能走多远。",
        nodes: [
          { label: "故事", place: "美国 / 全球", role: "IP、剧本与创意", body: "故事是起点，也是最早被资本与市场筛选的环节。谁能定义“全球可理解”的叙事，谁就拥有更大的发行空间。", friction: "文化折扣与本地审查意味着，并非所有故事都能平等地穿越边界。" },
          { label: "制作", place: "新西兰 / 印度 / 英国", role: "拍摄、动画与后期", body: "制作被拆分为可跨时区交付的模块：动画、特效、剪辑与本地化可以分布在多个国家。", friction: "补贴、签证与劳工规则会影响制作地点，创意劳动也面临被低成本替代的压力。" },
          { label: "算力", place: "全球云", role: "渲染、特效与 AI 工具", body: "算力成为新的制片基础设施。个人与小团队第一次能够租用过去只有大制片厂才拥有的能力。", friction: "能源、芯片与平台价格决定谁能使用先进工具；AI 版权规则仍在重画边界。" },
          { label: "发行", place: "流媒体 / 院线", role: "本地化、配额与审核", body: "平台把内容带到全球，也用推荐算法重新组织观众。发行不再只是渠道，而是关于可见性的权力。", friction: "内容配额、数据本地化与平台分成，使全球发行变成一场规则谈判。" },
          { label: "观众", place: "全球", role: "观看、参与与再创作", body: "观众不再只是接收者，也通过弹幕、二创与社交传播参与作品的生命周期。", friction: "平台与版权方控制二次创作的空间；跨文化误读也会迅速放大。" }
        ]
      }
    };

    let product = "phone";
    let nodeIndex = 0;
    let friction = false;

    const chain = $("[data-fw-chain]", root);
    const networkNote = $("[data-fw-network-note]", root);
    const nodeLabel = $("[data-fw-node-label]", root);
    const nodeTitle = $("[data-fw-node-title]", root);
    const nodeBody = $("[data-fw-node-body]", root);
    const frictionCopy = $("[data-fw-friction-copy]", root);
    const frictionText = frictionCopy ? $("p", frictionCopy) : null;
    const toggle = $("[data-fw-friction]", root);
    const live = $("[data-fw-live]", root);

    const renderDetail = () => {
      const node = products[product].nodes[nodeIndex];
      if (nodeLabel) nodeLabel.textContent = `节点 0${nodeIndex + 1} / ${node.label}`;
      if (nodeTitle) nodeTitle.textContent = node.role;
      if (nodeBody) nodeBody.textContent = node.body;
      if (frictionCopy) frictionCopy.hidden = !friction;
      if (frictionText) frictionText.textContent = node.friction;
      if (networkNote) networkNote.textContent = friction ? products[product].friction : products[product].ideal;
      $$(".fw-node", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(Number(button.dataset.node) === nodeIndex));
      });
      if (live) {
        live.textContent = `${node.label}，${node.place}。${node.body}${friction ? ` 现实摩擦：${node.friction}` : ""}`;
      }
    };

    const renderChain = () => {
      if (!chain) return;
      chain.replaceChildren();
      products[product].nodes.forEach((node, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "fw-node";
        button.dataset.node = String(index);
        button.setAttribute("aria-pressed", String(index === nodeIndex));
        const no = document.createElement("span");
        no.className = "fw-node__no";
        no.textContent = `0${index + 1}`;
        const label = document.createElement("b");
        label.textContent = node.label;
        const place = document.createElement("small");
        place.textContent = node.place;
        const frictionLabel = document.createElement("span");
        frictionLabel.className = "fw-node__friction";
        frictionLabel.textContent = "摩擦 / FRICTION";
        button.append(no, label, place, frictionLabel);
        button.addEventListener("click", () => {
          nodeIndex = index;
          renderDetail();
        });
        chain.append(button);
      });
      $$(".fw-product", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.product === product));
      });
      renderDetail();
    };

    $$(".fw-product", root).forEach((button) => {
      button.addEventListener("click", () => {
        product = button.dataset.product;
        nodeIndex = 0;
        renderChain();
      });
    });

    if (toggle) {
      toggle.addEventListener("change", () => {
        friction = toggle.checked;
        root.classList.toggle("has-friction", friction);
        renderDetail();
      });
    }

    renderChain();
  };

  /* ------------------------------------------------------------------
     13 · 领导力五线谱编排器
  ------------------------------------------------------------------ */
  const initFivePractices = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const practiceNames = {
      model: "以身作则",
      vision: "共启愿景",
      challenge: "挑战现状",
      enable: "使众人行",
      heart: "激励人心"
    };

    const challenges = {
      morale: {
        model: "先公开承担一件你一直要求团队做、自己却回避的难事，并给出完成时间。",
        vision: "重讲一次“为什么值得做好”：具体到客户或用户会因为我们的工作发生什么改变。",
        challenge: "挑一个大家反复抱怨的小流程，做两周试点，允许失败但必须复盘。",
        enable: "把一件小事完全交给一线决定，同时公开说明预算与边界。",
        heart: "在下次例会上具体感谢三个人做对的事，并说明它如何体现团队价值。"
      },
      change: {
        model: "先让出自己部门最不方便让出的资源，证明变革不是只改别人。",
        vision: "用同一句话说明变革后各方得到什么、付出什么，避免总部与本地各自想象。",
        challenge: "选一个风险最低、跨部门接触最频繁的接口，做出可复用的成功样板。",
        enable: "成立联合决策小组，让每个部门拥有真实提案权与共同责任，而不是只被通知。",
        heart: "公开感谢第一个做出让步的人，保护先合作的人不成为吃亏者。"
      },
      growth: {
        model: "示范如何做判断：把一次你的取舍过程公开讲清楚，包括放弃了什么。",
        vision: "让新人看见 12 个月后可以独立承担什么，而不只是本周任务清单。",
        challenge: "将一个小项目完整交给新人，设置护栏，不中途接管。",
        enable: "给判断标准与信息，不只给答案；让新人主持一次决策会。",
        heart: "奖励“做对判断”的过程，而不只奖励最终业绩。"
      }
    };

    let challenge = "morale";
    let selected = new Set();

    const count = $("[data-fp-count]", root);
    const summary = $("[data-fp-summary]", root);
    const detail = $("[data-fp-detail]", root);
    const live = $("[data-fp-live]", root);
    const rows = $$(".lc-practice-row", root);

    const renderSummary = () => {
      if (count) count.textContent = `${selected.size} / 5`;
      if (!summary || !detail) return;
      if (selected.size === 0) {
        summary.textContent = "先选择一条你愿意在本周练习的线。";
        detail.textContent = "五种实践可以同时发生。你不需要一次做到完美，只需要选择一个真实场景，把其中一个动作做具体。";
      } else {
        const names = [...selected].map((key) => practiceNames[key]).join(" + ");
        summary.textContent = selected.size === 5 ? "完整编排：五种实践已经同时到位。" : `本周先练：${names}`;
        const reminders = {
          1: "很好。一个动作只要能在一周内被团队真正看见，就比五个口号更有效。",
          2: "你正在把不同的领导动作组合起来。请为每一个动作写出具体时间、对象和可观察的结果。",
          3: "三条线开始形成合力。注意不要让它们变成三场彼此分散的活动。",
          4: "四条线已经合奏。最后补上你最不舒服的那一条——往往那就是团队的缺口。",
          5: "接下来检查它们是否相互支持：愿景是否为挑战提供了理由，认可是否让授权更可持续。"
        };
        detail.textContent = reminders[selected.size];
      }
      if (live) {
        live.textContent = selected.size
          ? `已编排 ${selected.size} 条实践：${[...selected].map((key) => practiceNames[key]).join("、")}。`
          : "尚未选择实践。";
      }
    };

    const syncRows = () => {
      rows.forEach((row) => {
        const key = row.dataset.practice;
        const action = $("[data-fp-action]", row);
        const status = $(".lc-row__status", row);
        if (action) action.textContent = challenges[challenge][key];
        row.setAttribute("aria-pressed", String(selected.has(key)));
        if (status) status.textContent = selected.has(key) ? "已编排" : "点击编排";
      });
    };

    const renderAll = () => {
      syncRows();
      renderSummary();
    };

    $$(".lc-challenge", root).forEach((button) => {
      button.addEventListener("click", () => {
        challenge = button.dataset.challenge;
        selected = new Set();
        $$(".lc-challenge", root).forEach((option) => {
          option.setAttribute("aria-pressed", String(option === button));
        });
        renderAll();
      });
    });

    rows.forEach((row) => {
      row.addEventListener("click", () => {
        const key = row.dataset.practice;
        if (selected.has(key)) selected.delete(key);
        else selected.add(key);
        renderAll();
      });
    });

    renderAll();
  };

  /* ------------------------------------------------------------------
     14 · 人生方程式
  ------------------------------------------------------------------ */
  const initLifeEquation = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const fields = {
      mind: $('[data-life-factor="mind"]', root),
      passion: $('[data-life-factor="passion"]', root),
      ability: $('[data-life-factor="ability"]', root)
    };
    const mindEl = $("[data-life-mind]", root);
    const passionEl = $("[data-life-passion]", root);
    const abilityEl = $("[data-life-ability]", root);
    const resultEl = $("[data-life-result]", root);
    const signEl = $("[data-life-sign]", root);
    const dial = $("[data-life-dial]", root);
    const reading = $("[data-life-reading]", root);
    const values = $("[data-life-values]", root);
    const live = $("[data-life-live]", root);
    const presets = $$("[data-life-preset]", root);

    const render = () => {
      const mind = Number(fields.mind ? fields.mind.value : 50);
      const passion = Number(fields.passion ? fields.passion.value : 60);
      const ability = Number(fields.ability ? fields.ability.value : 70);
      const result = (mind * passion * ability) / 10000;
      const negative = result < 0;
      if (mindEl) mindEl.textContent = `${mind > 0 ? "+" : ""}${mind}`;
      if (passionEl) passionEl.textContent = String(passion);
      if (abilityEl) abilityEl.textContent = String(ability);
      if (resultEl) resultEl.textContent = String(Math.abs(Math.round(result)));
      if (signEl) signEl.textContent = negative ? "−" : "+";
      if (dial) {
        dial.classList.toggle("is-negative", negative);
        dial.style.setProperty("--life-progress", `${Math.max(3, Math.min(Math.abs(result), 100))}%`);
      }
      if (values) {
        values.textContent = `${mind > 0 ? "+" : ""}${mind} × ${passion} × ${ability} / 10000 = ${result.toFixed(1)}`;
      }

      let text = "";
      if (negative) {
        text = "方向为负。能力与热情越高，结果越可能离你想要的地方更远。先停下来，校正“为什么做”。";
      } else if (result < 10) {
        text = "方向偏弱或能量不足。先校准判断标准，再谈更快的行动。";
      } else if (result < 25) {
        text = "方向为正，能力与热情正在形成复利。继续把“他人是否真正受益”放进判断。";
      } else if (result < 50) {
        text = "方向与能量形成合力。警惕自我感动：继续检查他人是否真的受益，而不是只证明自己很努力。";
      } else {
        text = "高能区。越有能力，越需要外部反馈与制度约束，避免把正向心念变成不可被质疑的自我确信。";
      }
      if (reading) reading.textContent = text;
      if (live) {
        live.textContent = `结果指数 ${result.toFixed(1)}。思维方式 ${mind}，热情 ${passion}，能力 ${ability}。${text}`;
      }
      presets.forEach((button) => button.setAttribute("aria-pressed", "false"));
    };

    Object.values(fields).forEach((range) => {
      if (range) range.addEventListener("input", render);
    });

    presets.forEach((button) => {
      button.addEventListener("click", () => {
        const valuesByName = {
          good: { mind: 70, passion: 85, ability: 60 },
          negative: { mind: -60, passion: 95, ability: 90 },
          ordinary: { mind: 45, passion: 55, ability: 55 }
        };
        const preset = valuesByName[button.dataset.lifePreset];
        if (!preset) return;
        Object.entries(preset).forEach(([key, value]) => {
          if (fields[key]) fields[key].value = String(value);
        });
        render();
        button.setAttribute("aria-pressed", "true");
      });
    });

    render();
  };

  /* ------------------------------------------------------------------
     01b · 知彼知己（一步实验）
  ------------------------------------------------------------------ */
  const initKnowEnemy = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const states = {
      both: {
        quote: "知彼知己，百战不殆。",
        note: "两侧都有信息，才谈得上“殆”与“不殆”。孙子没有给单边信息留下稳胜的位置。"
      },
      self: {
        quote: "不知彼而知己，一胜一负。",
        note: "只认清自己，胜负各半。知道自己的长处，不等于知道该把它用在哪里。"
      },
      neither: {
        quote: "不知彼，不知己，每战必殆。",
        note: "两边都空着，行动就只剩下运气。原句用的不是“危险”，是“每战必殆”。"
      }
    };

    let current = "self";
    const quote = $("[data-know-quote]", root);
    const note = $("[data-know-note]", root);
    const live = $("[data-know-live]", root);

    const render = () => {
      const state = states[current];
      if (quote) quote.textContent = state.quote;
      if (note) note.textContent = state.note;
      $$("[data-know]", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.know === current));
      });
      if (live) live.textContent = `${state.quote} ${state.note}`;
    };

    $$("[data-know]", root).forEach((button) => {
      button.addEventListener("click", () => {
        current = button.dataset.know;
        render();
      });
    });

    render();
  };

  /* ------------------------------------------------------------------
     02b · 距离在说话（一步实验）
  ------------------------------------------------------------------ */
  const initHallDistance = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const range = $("[data-hall-distance]", root);
    const note = $("[data-hall-note]", root);
    const live = $("[data-hall-live]", root);

    const render = () => {
      const value = Number(range ? range.value : 46);
      let text = "";
      if (value < 35) {
        text = "椅子还在远处。你保住了自己的舒适区，对方可能把它读成疏离；也可能正好松一口气。先别把“我自在”当成“得体”。";
      } else if (value <= 65) {
        text = "距离适中。没有越界，也没有靠近。此刻的“合适”，只是你这一侧的感觉。";
      } else {
        text = "椅子已经很近。霍尔说，不成文的规矩被打破时，人会先不安，再找理由。先看对方有没有后退，再决定要不要继续靠近。";
      }
      if (note) note.textContent = text;
      if (live) live.textContent = text;
    };

    if (range) range.addEventListener("input", render);
    render();
  };

  /* ------------------------------------------------------------------
     03b · 两副文化镜头（一步实验）
  ------------------------------------------------------------------ */
  const initCultureLenses = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const readings = {
      own: {
        quote: "“这太危险了，家长不负责任。”",
        note: "先记下这个判断。它来自你的童年经验，还不是现场事实。"
      },
      local: {
        quote: "“这是这一带孩子学习独立的一部分。”",
        note: "换一副镜头，孩子不是被抛下，而是在被允许参与家庭生计。理解它，不等于取消对儿童安全的判断。"
      }
    };

    let current = "own";
    const quote = $("[data-culture-quote]", root);
    const note = $("[data-culture-note]", root);
    const live = $("[data-culture-live]", root);

    const render = () => {
      const item = readings[current];
      if (quote) quote.textContent = item.quote;
      if (note) note.textContent = item.note;
      $$("[data-culture-lens]", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.cultureLens === current));
      });
      if (live) live.textContent = `${item.quote} ${item.note}`;
    };

    $$("[data-culture-lens]", root).forEach((button) => {
      button.addEventListener("click", () => {
        current = button.dataset.cultureLens;
        render();
      });
    });

    render();
  };

  /* ------------------------------------------------------------------
     04b · 价格签的背面（一步实验）
  ------------------------------------------------------------------ */
  const initGlobalLedger = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const price = $(".gc-ledger__price", root);
    const caption = $(".gc-ledger__caption", root);
    const front = $("[data-ledger-front]", root);
    const back = $("[data-ledger-back]", root);
    const note = $("[data-ledger-note]", root);
    const live = $("[data-ledger-live]", root);

    const render = (flipped) => {
      if (price) price.textContent = flipped ? "¥ 99 + ?" : "¥ 99";
      if (caption) caption.textContent = flipped ? "未计入的部分 / NOT IN THE PRICE" : "你支付的部分 / PRICE PAID";
      if (front) front.hidden = flipped;
      if (back) back.hidden = !flipped;
      if (note) {
        note.textContent = flipped
          ? "成本没有消失，只是被移到了价格签之外。问题不再是“我付了多少”，而是“剩下这些由谁付”。"
          : "你看到的是自己付了多少钱。还有一部分成本不在这张价格签上。";
      }
      $$("[data-ledger-flip]", root).forEach((button) => {
        button.setAttribute("aria-pressed", String((button.dataset.ledgerFlip === "true") === flipped));
      });
      if (live) live.textContent = note ? note.textContent : "";
    };

    $$("[data-ledger-flip]", root).forEach((button) => {
      button.addEventListener("click", () => render(button.dataset.ledgerFlip === "true"));
    });

    render(false);
  };

  /* ------------------------------------------------------------------
     05b · 房间里的十个人（一步实验）
  ------------------------------------------------------------------ */
  const initBuyInMiddle = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const result = $("[data-middle-result]", root);
    const live = $("[data-middle-live]", root);
    const texts = {
      loud: "你继续和鲍姆巴斯辩论。四个未表态的人在看：这场争论会不会也落到他们头上。",
      middle: "你把问题转向未表态的人：这个方案怎样降低他们的风险？最响的人仍在反对，但你不必先赢他。"
    };

    const render = (target) => {
      if (result) result.textContent = texts[target];
      $$("[data-middle-audience]", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.middleAudience === target));
      });
      if (live) live.textContent = texts[target];
    };

    $$("[data-middle-audience]", root).forEach((button) => {
      button.addEventListener("click", () => render(button.dataset.middleAudience));
    });

    render("loud");
  };

  /* ------------------------------------------------------------------
     06b · 抬盖（一步实验）
  ------------------------------------------------------------------ */
  const initLeadershipLid = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const range = $("[data-lid-range]", root);
    const value = $("[data-lid-value]", root);
    const cap = $("[data-lid-cap]", root);
    const output = $("[data-lid-output]", root);
    const live = $("[data-lid-live]", root);

    const render = () => {
      const level = Number(range ? range.value : 5);
      if (value) value.textContent = `${level} / 10`;
      if (cap) cap.style.setProperty("--lid", `${level * 10}%`);
      let text = "";
      if (level <= 3) {
        text = "盖子还低。先别谈扩张；你个人的判断半径还没有覆盖现在的团队。";
      } else if (level <= 6) {
        text = "当前只能维持，难以跃迁。把优先次序与授权练成可复制的动作，盖子才会抬起来。";
      } else {
        text = "盖子抬高了。下一步是让团队也长出领导力，否则你仍要替所有人抬高上限。";
      }
      const full = `团队能抵达的上限，停在第 ${level} 格。${text}`;
      if (output) output.textContent = full;
      if (live) live.textContent = full;
    };

    if (range) range.addEventListener("input", render);
    render();
  };

  /* ------------------------------------------------------------------
     07b · 主动性阶梯（一步实验）
  ------------------------------------------------------------------ */
  const initMonkeyLadder = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const levels = {
      1: ["第 1 级 · 等待指示", "小林不带方案，只等命令。下一步在你背上，主动性也停在最低层。"],
      2: ["第 2 级 · 请示要做什么", "他愿意行动，但把“做什么”也交给你。猴子还在你这里，只是换了一个问题。"],
      3: ["第 3 级 · 提出建议，按裁断结果行动", "他带来方案，你保留拍板权。下一步已经回到他手里，但判断仍在你这里。"],
      4: ["第 4 级 · 行动，但需立即请示", "他先行动，再快速报告。边界清楚，风险仍在可控范围。"],
      5: ["第 5 级 · 独立行动，例行报告", "他拥有完整的下一步，只按约定汇报。你从“替他想”退到“看结果、给反馈”。"]
    };

    const title = $("[data-ladder-title]", root);
    const note = $("[data-ladder-note]", root);
    const live = $("[data-ladder-live]", root);

    const render = (level) => {
      const item = levels[level];
      if (title) title.textContent = item[0];
      if (note) note.textContent = item[1];
      $$("[data-ladder-level]", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(Number(button.dataset.ladderLevel) === Number(level)));
      });
      if (live) live.textContent = `${item[0]}。${item[1]}`;
    };

    $$("[data-ladder-level]", root).forEach((button) => {
      button.addEventListener("click", () => render(button.dataset.ladderLevel));
    });

    render(1);
  };

  /* ------------------------------------------------------------------
     08b · 标题里的结论（一步实验）
  ------------------------------------------------------------------ */
  const initPyramidTitle = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const texts = {
      topic: "A 只说明了范围。读者知道要读什么，却不知道读完要做什么决定。",
      question: "B 提出了问题，但没有带走答案。标题只负责开场，还是也能承担结论？",
      answer: "C 把答案放在了最前面。读者可以先同意、反对或追问，而不是先陪你走完整个季度。"
    };

    const out = $("[data-title-out]", root);
    const live = $("[data-title-live]", root);

    const render = (choice) => {
      if (out) out.textContent = texts[choice];
      $$("[data-title-choice]", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.titleChoice === choice));
      });
      if (live) live.textContent = texts[choice];
    };

    $$("[data-title-choice]", root).forEach((button) => {
      button.addEventListener("click", () => render(button.dataset.titleChoice));
    });

    render("question");
  };

  /* ------------------------------------------------------------------
     09b · 翻译成他的橡果（一步实验）
  ------------------------------------------------------------------ */
  const initSquirrelTranslate = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const button = $("[data-translate-toggle]", root);
    const text = $("[data-translate-text]", root);
    const note = $("[data-translate-note]", root);
    const live = $("[data-translate-live]", root);

    let translated = false;
    const render = () => {
      if (translated) {
        if (text) text.textContent = "“这套系统上线后，你每单要填的表从 6 张变成 1 张，月底不用再为对账多加两天班。”";
        if (note) note.textContent = "先不解释系统，先说他每天少做什么。相关性不是把语气变热情，是把收益说到他的工作日里。";
      } else {
        if (text) text.textContent = "先别解释系统。点一下，把这句话翻成他的橡果。";
        if (note) note.textContent = "你的版本说的是系统；听众的橡果，是他每天少填几张表。";
      }
      if (button) button.setAttribute("aria-pressed", String(translated));
      if (button) button.textContent = translated ? "看回你的版本" : "翻成他的橡果";
      if (live) live.textContent = `${text ? text.textContent : ""} ${note ? note.textContent : ""}`;
    };

    if (button) {
      button.addEventListener("click", () => {
        translated = !translated;
        render();
      });
    }

    render();
  };

  /* ------------------------------------------------------------------
     10b · 露多少（一步实验）
  ------------------------------------------------------------------ */
  const initWhyLedReveal = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const range = $("[data-reveal-range]", root);
    const say = $("[data-reveal-say]", root);
    const note = $("[data-reveal-note]", root);
    const live = $("[data-reveal-live]", root);

    const render = () => {
      const value = Number(range ? range.value : 48);
      let quote = "";
      let explanation = "";
      if (value < 30) {
        quote = "“没有问题，我来处理。”";
        explanation = "你把不确定收得太紧。团队只看到结论，听不到风险，也没机会补位。";
      } else if (value <= 65) {
        quote = "“我没有全部答案。风险在于供应商可能延迟。下一步先验证替代方案；周五前我来拍板。”";
        explanation = "真实，加上一个由你承担的决定。团队知道发生了什么，也知道接下来往哪走。";
      } else {
        quote = "“我也不知道怎么办，供应商那边完全不可控，我最近也很焦虑。”";
        explanation = "你把自己的焦虑全部倒了出来。团队收到的是不确定，不是下一步。";
      }
      if (say) say.textContent = quote;
      if (note) note.textContent = explanation;
      if (live) live.textContent = `${quote} ${explanation}`;
    };

    if (range) range.addEventListener("input", render);
    render();
  };

  /* ------------------------------------------------------------------
     11b · 换一种说法（一步实验）
  ------------------------------------------------------------------ */
  const initThinkingFrame = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const states = {
      gain: {
        gut: "“七成能成功。可以试。”",
        note: "同一个事实，被放进了“得到”的框里。风险没有被删掉，只是退到了背景。"
      },
      loss: {
        gut: "“三成会失败。再等等。”",
        note: "换成“失去”的框，同一组数据开始显得更危险。系统1对损失更敏感。"
      }
    };

    const gut = $("[data-frame-gut]", root);
    const note = $("[data-frame-note]", root);
    const live = $("[data-frame-live]", root);

    const render = (frame) => {
      const item = states[frame];
      if (gut) gut.textContent = item.gut;
      if (note) note.textContent = item.note;
      $$("[data-frame]", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.frame === frame));
      });
      if (live) live.textContent = `${item.gut} ${item.note}`;
    };

    $$("[data-frame]", root).forEach((button) => {
      button.addEventListener("click", () => render(button.dataset.frame));
    });

    render("gain");
  };

  /* ------------------------------------------------------------------
     12b · 你的工作有多“平”（一步实验）
  ------------------------------------------------------------------ */
  const initFlatPersonal = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const range = $("[data-flat-range]", root);
    const percent = $("[data-flat-percent]", root);
    const note = $("[data-flat-note]", root);
    const live = $("[data-flat-live]", root);

    const render = () => {
      const value = Number(range ? range.value : 52);
      if (percent) percent.textContent = `${value}%`;
      let text = "";
      if (value < 35) {
        text = "大部分工作靠现场、关系或隐性判断。它不容易被远程拆走，但也更难被看见和放大。";
      } else if (value <= 65) {
        text = "一半可以变成文档和远程交付。剩下的一半，要靠现场关系、隐性判断或承担责任来守住。";
      } else {
        text = "大部分任务可以被写清楚、交出去、按结果验收。这带来自由，也带来竞争：下一个接住它的人，可能不在你的城市。";
      }
      if (note) note.textContent = text;
      if (live) live.textContent = `${value}%。${text}`;
    };

    if (range) range.addEventListener("input", render);
    render();
  };

  /* ------------------------------------------------------------------
     13b · 一句承诺之后（一步实验）
  ------------------------------------------------------------------ */
  const initLcCredibility = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const states = {
      keep: "团队记住的是：你说到做到。下一次你说“我来处理”，他们会少问一句。",
      late: "事情最后做了，但时间承诺失效。团队会开始给你的截止日期自动加一段缓冲。",
      silent: "你没有解释，也没有再提。这件事从此变成一个没人敢问的空白。信誉不是一次演讲，是这种小账的累计。"
    };

    const out = $("[data-cred-out]", root);
    const live = $("[data-cred-live]", root);

    const render = (state) => {
      if (out) out.textContent = states[state];
      $$("[data-cred]", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.cred === state));
      });
      if (live) live.textContent = states[state];
    };

    $$("[data-cred]", root).forEach((button) => {
      button.addEventListener("click", () => render(button.dataset.cred));
    });

    render("keep");
  };

  /* ------------------------------------------------------------------
     14b · 作为人，何谓正确（一步实验）
  ------------------------------------------------------------------ */
  const initLivingDilemma = (root) => {
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";

    const states = {
      sell: "短期账补上了。但你把“客户是否被伤害”移出了决策，下一次需要理由时，你会更容易再移一次。",
      refuse: "你守住了边界，也可能失去一笔收入。拒绝不是终点：把替代方案和风险一起带回团队，才让原则可执行。",
      ask: "先把问题从“能不能做”换成“该不该做”。这一步不保证你选对，但会让你看见自己正在选。"
    };

    const out = $("[data-dilemma-out]", root);
    const live = $("[data-dilemma-live]", root);

    const render = (choice) => {
      if (out) out.textContent = states[choice];
      $$("[data-dilemma]", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.dilemma === choice));
      });
      if (live) live.textContent = states[choice];
    };

    $$("[data-dilemma]", root).forEach((button) => {
      button.addEventListener("click", () => render(button.dataset.dilemma));
    });

    render("ask");
  };

  /* ------------------------------------------------------------------
     Initialise the widgets present on the page.
  ------------------------------------------------------------------ */
  const initMap = {
    "five-factors": initFiveFactors,
    "silent-decoder": initSilentDecoder,
    iceberg: initIceberg,
    ripple: initRipple,
    "buy-in": initBuyIn,
    "leadership-diagnostic": initLeadershipDiagnostic,
    monkey: initMonkey,
    "pyramid-builder": initPyramidBuilder,
    acorn: initAcorn,
    "trust-coords": initTrustCoords,
    crt: initCRT,
    "flat-map": initFlatMap,
    "five-practices": initFivePractices,
    "life-equation": initLifeEquation,
    "know-enemy": initKnowEnemy,
    "hall-distance": initHallDistance,
    "culture-lenses": initCultureLenses,
    "global-ledger": initGlobalLedger,
    "buyin-middle": initBuyInMiddle,
    "leadership-lid": initLeadershipLid,
    "monkey-ladder": initMonkeyLadder,
    "pyramid-title": initPyramidTitle,
    "squirrel-translate": initSquirrelTranslate,
    "whyled-reveal": initWhyLedReveal,
    "thinking-frame": initThinkingFrame,
    "flat-personal": initFlatPersonal,
    "lc-credibility": initLcCredibility,
    "living-dilemma": initLivingDilemma
  };

  $$("[data-model]").forEach((root) => {
    const init = initMap[root.dataset.model];
    if (init) init(root);
  });
})();
