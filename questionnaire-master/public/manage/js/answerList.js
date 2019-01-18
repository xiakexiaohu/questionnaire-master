var url = location.href;
var questionnaireId = url.substring(url.lastIndexOf('/') + 1);
new Vue({
    el: '#sb',
    // inject:['reload'], //依赖注入，重新刷新页面
    data: {
        questionnaire: [],
        questions: [],
        questionsValidate: [],
        questionsCount: 0,
        answers: [],
        allQuestionsMap: new Map(),
        allOptionsMap: new Map(),
        totalAnswers: [],

        multipleSelection: [],
        keywords: '',
        del_list: [],
        isSearch: false,
        searchData: [],
        dialogFormVisible: false,
        specifyData: new Object(),
        total: 0,
        pageSize: 10,
        currentPage: 1,
        userInfo: '',
        isAdmin: false

    },
    created: function () {
        this.getData();
    },
    methods: {
        getData: function () {
            var self = this;

            //获取问卷题目
            fetch('/data/questionnaire/' + questionnaireId, {credentials: 'same-origin'})
                .then(function (response) {
                    return response.json();
                })
                .then(function (json) {
                    //admin.js中定义了req.session.user=username;
                    self.userInfo = json.userInfo;
                    if (self.userInfo.indexOf("admin@")==0) {
                        //超级管理员，具有删除权限,因为医生客户端以admin@邮箱作为账号开头
                        self.isAdmin=true;
                    }
                    self.questionnaire = json.questionnaire;
                    self.questions = json.questions;
                    var selectedQuestions = self.questionnaire.questions;
                    self.questions.forEach(function (question) {
                        if (selectedQuestions.indexOf(question._id) >= 0) {
                            question.selected = true;
                        }
                    });
                    var count = 0;
                    self.questions.forEach(function (question) {
                        if (question.selected) {
                            // 将有效的题目放入数组中，vue对数组的常用方法有，push,pop,shift,unshift,splice,sort,reverse
                            self.questionsValidate.push(question);
                            count++;
                        }
                    });
                    self.questionsCount = count;

                    //获取所有题目的信息
                    fetch('/data/allQuestions', {credentials: 'same-origin'})
                        .then(function (response) {
                            return response.json();
                        })
                        .then(function (json) {
                            //生成map
                            json.questions.forEach(function (question) {
                                self.allQuestionsMap.set(question._id, question.content);
                            })

                            //获取所有的选项信息
                            fetch('/data/allOptions', {credentials: 'same-origin'})
                                .then(function (response) {
                                    return response.json();
                                })
                                .then(function (json) {
                                    json.options.forEach(function (option) {
                                        self.allOptionsMap.set(option._id, option.content);
                                    })

                                    //获取问卷内容
                                    fetch('/data/answer/' + questionnaireId, {credentials: 'same-origin'})
                                        .then(function (response) {
                                            return response.json();
                                        })
                                        .then(function (json) {
                                            self.answers = json.answers;
                                            //对问卷详情进行切分处理,切分完的数据直接显示在
                                            // var resultArray=new Array();
                                            for (var i = 0; i < self.answers.length; i++) {
                                                //对数据进行切分
                                                var singleArray = new Array();
                                                var content = self.answers[i].content;
                                                var subAnswer = JSON.parse(content); //json.parse将text json文件转换对象
                                                for (var key in subAnswer) {
                                                    //单个id长度为24(string类型的)
                                                    if (typeof(subAnswer[key]) == 'string') {
                                                        //单选,或者简答题
                                                        if (self.allOptionsMap.get(subAnswer[key]) != undefined) {
                                                            //若是单选的话，则执行替换
                                                            subAnswer[key] = self.allOptionsMap.get(subAnswer[key]);
                                                        }

                                                    } else {
                                                        //多选,使用字符串进行拼接
                                                        var strValue = "";
                                                        for (var j = 0; j < subAnswer[key].length; j++) {
                                                            var newKey = subAnswer[key][j];
                                                            if (j != subAnswer[key].length - 1) {
                                                                strValue += self.allOptionsMap.get(newKey) + ",";
                                                            } else {
                                                                strValue += self.allOptionsMap.get(newKey);
                                                            }
                                                        }
                                                        subAnswer[key] = strValue;
                                                    }
                                                }
                                                self.answers[i].newContent = subAnswer;
                                                //列需要将对应的prop放在第一层，而不是在子集合内
                                                for (var qID in self.answers[i].newContent) {
                                                    self.answers[i][qID] = self.answers[i].newContent[qID];
                                                }
                                                //总的记录数
                                                self.total = self.answers.length;

                                                //将最后的结果更换为中文
                                                // console.log(subAnswer);
                                                self.totalAnswers.push(subAnswer);
                                            }
                                            //第一次给结果赋值,不能使用直接引用，不然操作searchData等同于操作answers
                                            for (var i in self.answers) {
                                                self.searchData.push(self.answers[i]);
                                            }
                                            console.log(self.searchData);
                                        })
                                        .catch(function (ex) {
                                            console.log('fetch answer error', ex);
                                        });
                                })
                                .catch(function (ex) {
                                    console.log('fetch all options error', ex)
                                })
                        })
                        .catch(function (ex) {
                            console.log('fetch all questions error', ex);
                        })

                })
                .catch(function (ex) {
                    console.log('parsing failed', ex);
                })
        },
        //获取问卷详情
        handleDetail: function (index, row) {
            var self = this;
            self.dialogFormVisible = true;
            //对数据赋空
            for (var qID in self.answers[index].newContent) {
                //题目
                var questionTitle = self.allQuestionsMap.get(qID);
                //答案
                var optionTitle = self.answers[index].newContent[qID];
                //动态给对象赋值
                //Vue动态的添加数据
                self.$set(self.specifyData, questionTitle, optionTitle);
            }

        },
        handleClose: function (done) {
            var self = this;
            self.dialogFormVisible = false;
        },
        //删除问卷
        deleteAnswer: function (index, row) {
            var self = this;
            var answerId = self.answers[index]._id;
            this.$confirm('您确定删除？').then(_ => {
                //确认
                fetch('/data/answer/' + answerId, {credentials: 'same-origin', method: 'delete'})
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (json) {
                        if (!json.success) {
                            self.errorMessage = json.error;
                        } else {
                            //返回原操作页面,重新取了数据
                            window.location.href = '/answerList/' + questionnaireId;
                            // history.replaceState('','','answerList');
                            //返回已答问卷+questionnairId
                            // http://localhost:8080/manager/answerList/5b052b08f3eed83dfcfbfbc1
                            //http://localhost:8080/answerList/5b052b08f3eed83dfcfbfbc1
                        }
                    });
            }).catch(_ => {
                //取消
                //TODO
            })
        },
        //查找操作
        search: function () {
            var self = this;
            //赋值为空
            var tempSearchData = [];
            var isExist = false;
            if (self.keywords != '') {
                for (var i = 0; i < self.answers.length; i++) {
                    //遍历判断是否包含该值(模糊查询)
                    var tempArr = Object.values(self.answers[i]);
                    for (var j in tempArr) {
                        var strTarget = tempArr[j].toString();
                        if (strTarget.indexOf(self.keywords) != -1) {
                            isExist = true;
                            tempSearchData.push(self.answers[i]);
                            break;
                        }
                    }
                }
            } else {
                //初始化原数据
                self.searchData = [];
                for (var i in self.answers) {
                    self.searchData.push(self.answers[i]);
                }
            }
            if (isExist) {
                //搜索存在结果
                self.searchData = [];
                for (var i in tempSearchData) {
                    self.searchData.push(tempSearchData[i]);
                }
            }
        },
        //分页实现
        current_change: function (currentPage) {
            this.currentPage = currentPage;
        },
        handleSelectionChange: function (mutipleSelection) {
            this.multipleSelection = mutipleSelection;
        },
        delAll: function () {
            //获取所有选中的行id组成的字符串，以逗号分隔
            var ids = this.multipleSelection.map(item => item._id).join();
            //由于fetch无法传递数组，所以只能将ids传递过去，在dao层进行拆分
            fetch('/data/answer/' + ids, {credentials: 'same-origin', method: 'delete'})
                .then(function (response) {
                    return response.json();
                })
                .then(function (json) {
                    if (!json.success) {
                        self.errorMessage = json.error;
                    } else {
                        //返回原操作页面,重新取了数据
                        window.location.href = '/answerList/' + questionnaireId;
                        // history.replaceState('','','answerList');
                        //返回已答问卷+questionnairId
                        // http://localhost:8080/manager/answerList/5b052b08f3eed83dfcfbfbc1
                        //http://localhost:8080/answerList/5b052b08f3eed83dfcfbfbc1
                    }
                });
        }

    }

});
