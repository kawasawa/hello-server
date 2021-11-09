import express from 'express';
import { check } from 'express-validator';
import util from 'util';

import { constants } from '../../constants';
import { read, update } from '../../functions/resource/user';
import verifyValidationResult from '../../middlewares/verifyValidationResult';

const router = express.Router();

/**
 * Read
 */
router.get('', read);

/**
 * Update
 */
router.patch(
  '',
  [
    check('name')
      .not()
      .isEmpty()
      .withMessage(constants.message.error.checkIsEmpty)
      .isLength({ max: 255 })
      .withMessage(util.format(constants.message.error.checkIsLengthMax, 255)),
    check('email')
      .not()
      .isEmpty()
      .withMessage(constants.message.error.checkIsEmpty)
      .isLength({ max: 255 })
      .withMessage(util.format(constants.message.error.checkIsLengthMax, 255))
      .isEmail()
      .withMessage(constants.message.error.emailFormat),
  ],
  verifyValidationResult,
  update
);

export default router;
