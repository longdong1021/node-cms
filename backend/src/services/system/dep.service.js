var async = require('async'),
	mysql = require('../../lib/mysqldb.lib'),
	logger = require('../../lib/logger.lib'),
	depModel = require('../../models/system/dep.model'),
	CONSTANTS = require('../../config/constants.config'),
	baseService = require('../base.service');

exports.one = function (where, callback) {
	mysql.where(where).select(depModel.tbname,function(err,rows){
		if(err){
			logger.errorDB(__filename, err);
			return callback(err);
		}
		if(!rows) return callback();
		return callback(null,rows[0]);
	});
}

exports.add = function(dep,callback) {
	mysql.insert(depModel.tbname , dep, function(err,resId){
		if(err){
			logger.errorDB(__filename, err);
			return callback(err);
		}
		return callback(null, resId);
	});
}

exports.update = function (data, where, callback) {
	async.waterfall([
		function(callback){
			let params = {
				tbname: depModel.tbname,
				pids: data.pids == '0' ? '' : data.pids,
				id: data.id
			};
			mysql.execute(baseService.SQL_updateChildPids,params,function(err, res){
				callback(err, res);
			});
		},
		function(result, callback){
			mysql.where(where).update(depModel.tbname, data, function(err,res){
				if(err){
					logger.errorDB(__filename, err);
					return callback(err);
				}
				return callback(null);
			});
		}
	], function(err, result){
		if(err){
			logger.errorDB(__filename, err);
			return callback(err);
		}
		return callback(null);
	});
}

exports.delete = function(where, callback){
	mysql.where(where).remove(depModel.tbname,function(err,res){
		if(err){
			logger.errorDB(__filename, err);
			return callback(err);
		}
		return callback(null);
	});
}

exports.lists = function(where, callback){

	mysql.where(where)
		.order({ pids: 'asc' })
		.select(depModel.tbname, function(err,rows){
			if(err){
				logger.errorDB(__filename, err);
				return callback(err);
			}
			return callback(null, rows);
		});
}

exports.allLists = function(callback){
	let where = {
		status:CONSTANTS.DEP_STATUS.NORMAL
	};

	mysql.where(where).select(depModel.tbname,function(err,res){
		if(err){
		  logger.errorDB(__filename, err);
		  return callback(err);
		}
		return callback(null,res);
	});
}

exports.getChildById = function(depId, callback){
	let params = {
		tbname: depModel.tbname,
		id: depId
	}
	let sql = baseService.SQL_selectChildById;
	mysql.execute(sql,params,function(err, rows){
		if(err){
			logger.errorDB(__filename, err);
			return callback(err);
		}
		return callback(null, rows);
	});
}

exports.getParentsById = function(depId, callback){

	async.waterfall([
		function(callback){
			exports.one({ id: depId }, function(error, dep){
				return callback(error, dep);
			});
		},
		function(dep, callback){
			let pids = dep.pids.split(',').map((id)=>{ return parseInt(id); });
			pids.push(dep.id);
			exports.lists({ id: ['in', pids] }, function(error, deps){
				return callback(error, deps);
			})
		}
	], function(err, deps){
		if(err){
			logger.errorDB(__filename, err);
			return callback(err);
		}
		return callback(null, deps);
	});
}	
