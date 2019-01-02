var Option = require('../models/option');

exports.delete = function (req, res) {
    var optionId = req.params.option;
    Option.findByIdAndRemove(optionId, function (err, option) {
        if (err) {
            return res.json({
                success: false,
                error: err.message
            });
        }
        res.json({
            success: true,
            option: option
        });
    });
};

exports.allDetail=function (req,res) {
    Option.find()
        .select('content')
        .exec(function (err,options) {
            if(err){
                return res.json({
                    success:false,
                    error:err.message
                });
            }
            if(!options){
                return res.json({
                    success:false,
                    error:'option not exist'
                });
            }
            return res.json({
                success:true,
                options:options
            });
        })
}
